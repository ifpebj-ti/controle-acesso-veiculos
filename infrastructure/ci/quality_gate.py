"""Aggregate the existing PR workflows for the exact reviewed source."""

import argparse
import fnmatch
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


WORKFLOWS = (
    "ci-backend.yml",
    "ci-frontend.yml",
    "ci-containers.yml",
    "ci-demo-data.yml",
    "ci-database-recovery.yml",
    "ci-oci-backup.yml",
    "ci-oci-homologation.yml",
    "dependency-review.yml",
)


class GateError(Exception):
    """A required validation is missing, failed or cannot be verified."""


def pull_request_paths(text):
    """Validate the simple PR path-list format used by these workflows.

    Fail on unsupported filters so a future YAML change cannot silently omit CI.
    This deliberately supports only the repository's existing quoted path lists.
    """
    lines = text.splitlines()
    try:
        start = lines.index("  pull_request:") + 1
    except ValueError as error:
        raise GateError("A validation workflow has no supported PR trigger") from error
    block = []
    for line in lines[start:]:
        if line.strip() and len(line) - len(line.lstrip()) < 4:
            break
        if line.strip():
            block.append(line)
    if not block:
        return None
    if block[0] != "    paths:":
        raise GateError("Unsupported PR filters require a gate policy update")
    patterns = []
    for line in block[1:]:
        match = re.fullmatch(r'      - ("[^"\\]+")', line)
        if match is None:
            raise GateError("Unsupported PR path syntax")
        pattern = json.loads(match[1])
        if pattern.startswith("!") or "?" in pattern or "[" in pattern:
            raise GateError("Unsupported PR path pattern")
        patterns.append(pattern)
    if not patterns:
        raise GateError("Empty PR path filters")
    return patterns


def required_workflows(paths, root):
    required = []
    for workflow in WORKFLOWS:
        patterns = pull_request_paths(
            (root / ".github/workflows" / workflow).read_text(encoding="utf-8")
        )
        if patterns is None or any(
            fnmatch.fnmatchcase(path, pattern)
            for path in paths
            for pattern in patterns
        ):
            required.append(workflow)
    return required


def requires_codeql(paths):
    suffixes = (".cs", ".js", ".jsx", ".ts", ".tsx", ".py")
    return any(
        path.endswith(suffixes) or path.startswith(".github/workflows/")
        for path in paths
    )


def assess(required, runs, checks, head, base, number, codeql):
    pending = []
    failures = []
    for workflow in required:
        candidates = [
            run for run in runs
            if run.get("path") == ".github/workflows/" + workflow
            and run.get("head_sha") == head
            and run.get("event") == "pull_request"
            and any(
                pr.get("number") == number
                and pr.get("head", {}).get("sha") == head
                and pr.get("base", {}).get("sha") == base
                for pr in run.get("pull_requests", [])
            )
        ]
        latest = max(candidates, key=lambda run: run["id"], default=None)
        if latest is None or latest.get("status") != "completed":
            pending.append(workflow)
        elif latest.get("conclusion") != "success":
            failures.append(workflow)
    if codeql:
        candidates = [
            check for check in checks
            if check.get("name") == "CodeQL"
            and check.get("head_sha") == head
            and check.get("app", {}).get("slug") == "github-advanced-security"
        ]
        latest = max(candidates, key=lambda check: check["id"], default=None)
        if latest is None or latest.get("status") != "completed":
            pending.append("CodeQL")
        elif latest.get("conclusion") != "success":
            failures.append("CodeQL")
    return pending, failures


def api_get(repository, endpoint, token):
    request = Request(
        "https://api.github.com/repos/" + repository + "/" + endpoint,
        headers={
            "Authorization": "Bearer " + token,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urlopen(request, timeout=20) as response:
        return json.load(response)


def paginated(repository, endpoint, key, token):
    items = []
    separator = "&" if "?" in endpoint else "?"
    for page in range(1, 6):
        data = api_get(repository, endpoint + separator + urlencode(
            {"per_page": 100, "page": page}
        ), token)[key]
        items.extend(data)
        if len(data) < 100:
            return items
    raise GateError("Validation response exceeds the bounded page limit")


def run_gate(event, root, repository, token, timeout, interval):
    if re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository) is None:
        raise GateError("Invalid repository identifier")
    pr = event["pull_request"]
    number = pr["number"]
    head, base = pr["head"]["sha"], pr["base"]["sha"]
    if not isinstance(number, int) or number <= 0 or any(
        re.fullmatch(r"[0-9a-f]{40}", sha) is None for sha in (head, base)
    ):
        raise GateError("Invalid PR source")
    result = subprocess.run(
        ["git", "diff", "--name-only", "--no-renames", "-z", base + "..." + head],
        cwd=root, capture_output=True, check=True,
    )
    paths = result.stdout.decode("utf-8").split("\0")
    paths = [path for path in paths if path]
    required = required_workflows(paths, root)
    codeql = requires_codeql(paths)
    print("Required workflows: " + ", ".join(required), flush=True)
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        current = api_get(repository, "pulls/" + str(number), token)
        if current["head"]["sha"] != head or current["base"]["sha"] != base:
            raise GateError("PR source or base changed; validate the current composition")
        runs = paginated(repository, "actions/runs?" + urlencode(
            {"event": "pull_request", "head_sha": head}
        ), "workflow_runs", token)
        checks = paginated(repository, "commits/" + head + "/check-runs",
                           "check_runs", token) if codeql else []
        pending, failures = assess(required, runs, checks, head, base, number, codeql)
        if failures:
            raise GateError("Required validation failed: " + ", ".join(failures))
        if not pending:
            print("Quality gate passed for the reviewed PR source", flush=True)
            return
        print("Waiting for: " + ", ".join(pending), flush=True)
        time.sleep(min(interval, max(0, deadline - time.monotonic())))
    raise GateError("Required validation did not finish before the gate deadline")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout-seconds", type=int, default=3000)
    parser.add_argument("--interval-seconds", type=int, default=30)
    args = parser.parse_args()
    if args.timeout_seconds <= 0 or args.interval_seconds <= 0:
        parser.error("Timeout and interval must be positive")
    try:
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
        run_gate(event, Path.cwd(), os.environ["GITHUB_REPOSITORY"],
                 os.environ["GITHUB_TOKEN"], args.timeout_seconds, args.interval_seconds)
    except HTTPError as error:
        print("GitHub API verification failed with HTTP " + str(error.code), file=sys.stderr)
        return 1
    except (GateError, KeyError, ValueError, OSError, URLError, subprocess.CalledProcessError) as error:
        print("Quality gate could not verify required validations (" + type(error).__name__ + ")",
              file=sys.stderr)
        if isinstance(error, GateError):
            print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
