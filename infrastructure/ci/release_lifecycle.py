"""Prepare reviewed releases; never merge PRs, move tags or deploy a VM."""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import re
import subprocess
from zoneinfo import ZoneInfo

VERSION = r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)"


def valid_version(value):
    if not re.fullmatch(VERSION, value):
        raise ValueError("Expected a canonical MAJOR.MINOR.PATCH version")
    return value


def branch_version(branch):
    match = re.fullmatch(r"chore/issue-[1-9][0-9]*-release-v(" + VERSION + r")", branch)
    if not match:
        raise ValueError("Not a reviewed version-preparation branch")
    return valid_version(match.group(1))


def notes(text, version):
    valid_version(version)
    pattern = r"(?m)^## \[" + re.escape(version) + r"\] - \d{4}-\d{2}-\d{2}\s*$"
    headings = list(re.finditer(pattern, text))
    if len(headings) != 1:
        raise ValueError("Expected exactly one dated changelog section for this version")
    start = headings[0].end()
    end = re.search(r"(?m)^## ", text[start:])
    body = text[start:start + end.start() if end else len(text)].strip()
    if not re.search(r"(?m)^- ", body):
        raise ValueError("Release notes are empty")
    return body + "\n"


def prepare(text, bump, issue, on_date):
    if bump not in ("patch", "minor") or not re.fullmatch(r"[1-9][0-9]*", str(issue)):
        raise ValueError("Expected patch/minor and a preparation issue number")
    if text.count("## [Unreleased]") != 1:
        raise ValueError("Expected exactly one Unreleased section")
    release_headers = list(re.finditer(r"(?m)^## \[(" + VERSION + r")\] - ", text))
    if not release_headers:
        raise ValueError("A published-version baseline is required")
    old = release_headers[0].group(1)
    major, minor, patch = map(int, old.split("."))
    version = f"{major}.{minor + 1}.0" if bump == "minor" else f"{major}.{minor}.{patch + 1}"
    if any(h.group(1) == version for h in release_headers):
        raise ValueError("Version already exists")
    start = text.index("## [Unreleased]") + len("## [Unreleased]")
    following = re.search(r"(?m)^## ", text[start:])
    if not following:
        raise ValueError("Missing previous version")
    end = start + following.start()
    body = text[start:end].strip()
    first_section = re.search(r"(?m)^### ", body)
    if first_section:
        body = body[first_section.start():]
    if not re.search(r"(?m)^- ", body):
        raise ValueError("No incorporated release changes to prepare")
    updated = text[:start] + f"\n\n## [{version}] - {on_date}\n\n" + body + "\n\n" + text[end:]
    return updated, {"version": version, "issue": int(issue),
                     "branch": f"chore/issue-{issue}-release-v{version}"}


def run(args, *, optional=False):
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
    if result.returncode and not optional:
        raise RuntimeError("Release operation failed: " + args[0] + " " + args[1])
    return result


def repo_name():
    value = os.environ.get("GITHUB_REPOSITORY", "ifpebj-ti/controle-acesso-veiculos")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", value):
        raise ValueError("Invalid repository")
    return value


def api(path, payload=None, allow_missing=False):
    args = ["gh", "api", "repos/" + repo_name() + "/" + path]
    if payload is not None:
        # JSON travels on stdin, never through shell interpolation.
        result = subprocess.run(args + ["--method", "POST", "--input", "-"],
            input=json.dumps(payload), capture_output=True, text=True, encoding="utf-8")
    else:
        result = run(args, optional=True)
    if result.returncode:
        if allow_missing and "HTTP 404" in result.stderr:
            return None
        raise RuntimeError("GitHub release API operation failed")
    return json.loads(result.stdout) if result.stdout.strip() else None


def tag_target(reference):
    item = reference["object"]
    for _ in range(4):
        if item["type"] == "commit":
            return item["sha"]
        if item["type"] != "tag":
            break
        item = api("git/tags/" + item["sha"])["object"]
    raise ValueError("Unsupported tag target")


def verify_or_create_tag(version, commit, body):
    existing = api("git/ref/tags/v" + version, allow_missing=True)
    if existing:
        if tag_target(existing) != commit:
            raise ValueError("Immutable release tag points to another commit; refusing overwrite")
        return
    tag = api("git/tags", {"tag": "v" + version, "message": "Release v" + version + "\n\n" + body,
                           "object": commit, "type": "commit"})
    api("git/refs", {"ref": "refs/tags/v" + version, "sha": tag["sha"]})


def source_notes(commit, version):
    if not re.fullmatch(r"[a-fA-F0-9]{40}", commit):
        raise ValueError("Expected a full reviewed commit SHA")
    if run(["git", "merge-base", "--is-ancestor", commit, "origin/main"], optional=True).returncode:
        raise ValueError("Release source is not incorporated into origin/main")
    text = run(["git", "show", commit + ":CHANGELOG.md"]).stdout
    return notes(text, version)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prepare")
    p.add_argument("--bump", choices=("patch", "minor"), required=True)
    p.add_argument("--issue", required=True)
    p.add_argument("--plan", type=Path, required=True)
    p = sub.add_parser("propose")
    p.add_argument("--plan", type=Path, required=True)
    p = sub.add_parser("tag")
    p.add_argument("--branch", required=True)
    p.add_argument("--commit", required=True)
    for name in ("notes", "publish"):
        p = sub.add_parser(name)
        p.add_argument("--version", required=True)
        p.add_argument("--commit", required=True)
        p.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    if args.command == "prepare":
        path = Path("CHANGELOG.md")
        text, plan = prepare(path.read_text(encoding="utf-8"), args.bump, args.issue,
                             datetime.now(ZoneInfo("America/Fortaleza")).date().isoformat())
        path.write_text(text, encoding="utf-8", newline="\n")
        args.plan.write_text(json.dumps(plan), encoding="utf-8")
        print("Prepared " + plan["version"] + "; no tag/release/deployment created")
    elif args.command == "propose":
        plan = json.loads(args.plan.read_text(encoding="utf-8"))
        version = branch_version(plan["branch"])
        if version != valid_version(plan["version"]) or not re.fullmatch(r"[1-9][0-9]*", str(plan["issue"])):
            raise ValueError("Invalid generated release plan")
        issue = json.loads(run(["gh", "issue", "view", str(plan["issue"]), "--repo", repo_name(), "--json", "state"]).stdout)
        if issue["state"] != "OPEN":
            raise ValueError("Use an open preparation issue with a reviewable scope")
        run(["git", "switch", "-c", plan["branch"]])
        run(["git", "add", "--", "CHANGELOG.md"])
        run(["git", "commit", "-m", "chore(release): prepare v" + version, "-m", "Refs #" + str(plan["issue"])])
        run(["git", "push", "origin", "HEAD:refs/heads/" + plan["branch"]])
        body = "Prepare the incorporated changelog for v" + version + ".\n\nRefs #" + str(plan["issue"]) + ".\n\nDraft only: verify composition, approve pending workflow runs when GitHub requests it, and review all required checks before merge. This does not publish or deploy. The existing container gates remain mandatory."
        result = run(["gh", "pr", "create", "--draft", "--repo", repo_name(), "--base", "main", "--head", plan["branch"], "--title", "chore(release): prepare v" + version, "--body", body], optional=True)
        if result.returncode:
            # Organization policy may prohibit bot PRs; never weaken it or add a PAT.
            if "not permitted" not in result.stderr.lower() and "not allowed" not in result.stderr.lower():
                raise RuntimeError("Draft PR creation failed; inspect the prepared branch before retry")
            link = "https://github.com/" + repo_name() + "/compare/main..." + plan["branch"] + "?expand=1"
            message = "Proposal branch prepared; bot PR creation blocked by repository policy. A human must open and review: " + link
            print(message)
            if os.environ.get("GITHUB_STEP_SUMMARY"):
                with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a", encoding="utf-8") as out:
                    out.write(message + "\n")
            return 0
        print(result.stdout.strip())
    elif args.command == "tag":
        version = branch_version(args.branch)
        body = source_notes(args.commit, version)
        verify_or_create_tag(version, args.commit, body)
        existing_release = run(["gh", "release", "view", "v" + version, "--repo", repo_name(), "--json", "isDraft"], optional=True)
        if existing_release.returncode == 0 and not json.loads(existing_release.stdout)["isDraft"]:
            print("Tag and published release already match; no rebuild or overwrite")
            return 0
        run(["gh", "workflow", "run", "ci-containers.yml", "--repo", repo_name(), "--ref", "v" + version])
        print("Immutable tag verified; container pipeline explicitly dispatched. No release or VM promotion claimed.")
    else:
        version = valid_version(args.version)
        body = source_notes(args.commit, version)
        args.output.write_text(body, encoding="utf-8")
        if args.command == "publish":
            reference = api("git/ref/tags/v" + version)
            if tag_target(reference) != args.commit:
                raise ValueError("Tag/source mismatch")
            current = run(["gh", "release", "view", "v" + version, "--repo", repo_name(), "--json", "isDraft"], optional=True)
            if current.returncode == 0 and not json.loads(current.stdout)["isDraft"]:
                print("Published release preserved; no overwrite")
                return 0
            if current.returncode == 0:
                command = ["gh", "release", "edit", "v" + version, "--draft=false", "--target", args.commit]
            else:
                command = ["gh", "release", "create", "v" + version, "--verify-tag", "--target", args.commit]
            run(command + ["--repo", repo_name(), "--title", version, "--notes-file", str(args.output)])
            print("GitHub Release published after successful image manifests; no VM deployment performed")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, RuntimeError, OSError) as error:
        print(str(error), file=__import__('sys').stderr)
        raise SystemExit(1)
