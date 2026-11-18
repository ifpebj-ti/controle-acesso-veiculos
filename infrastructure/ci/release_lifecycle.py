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
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", timeout=120)
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
            input=json.dumps(payload), capture_output=True, text=True, encoding="utf-8", timeout=120)
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


def review_template(changelog_body, version):
    """A proposal needs real human editing before it can become a tag."""
    bullets = re.findall(r"(?m)^- (.+(?:\n  .+)*)", changelog_body)
    highlights = ["- " + " ".join(item.split()) for item in bullets[:8]]
    return ("## Technical MVP release\n\n<!-- REVIEW_REQUIRED -->\n\n"
            "Reviewed technical MVP " + valid_version(version) + " for homologation; not institutional production approval.\n\n"
            "### Highlights\n\n" + "\n".join(highlights) + "\n\n"
            "### Known limits\n\n"
            "- Review this version's remaining acceptance and operational limits.\n")


def validate_reviewed_notes(text):
    if "REVIEW_REQUIRED" in text or "Review this version's" in text:
        raise ValueError("Release notes still require human review")
    if len(text) > 12000 or "\ufffd" in text:
        raise ValueError("Release notes are oversized or contain invalid replacement text")
    if not text.startswith("## Technical MVP release\n"):
        raise ValueError("Expected the Technical MVP release heading")
    for heading in ("### Highlights", "### Known limits"):
        if text.count(heading) != 1:
            raise ValueError("Expected one highlights and one known-limits section")
        section = text.split(heading, 1)[1].split("\n### ", 1)[0]
        if not re.search(r"(?m)^- \S", section):
            raise ValueError("Highlights and limits must contain reviewed bullets")
    for reserved in ("### Container images", "### Validation and supply chain"):
        if reserved in text:
            raise ValueError("Publication metadata is generated after manifest verification")
    return text.strip() + "\n"


def source_reviewed_notes(commit, version):
    source_notes(commit, version)  # Require incorporated source and dated changelog too.
    text = run(["git", "show", commit + ":docs/releases/" + valid_version(version) + ".md"]).stdout
    return validate_reviewed_notes(text)


def verified_manifests(version, commit):
    valid_version(version)
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Expected the full release source")
    result = {}
    for component in ("backend", "frontend"):
        image = "ghcr.io/" + repo_name().lower() + "-" + component
        reference = image + ":" + version
        raw = json.loads(run(["docker", "buildx", "imagetools", "inspect", reference, "--raw"]).stdout)
        entries = raw.get("manifests") if isinstance(raw, dict) else None
        if not isinstance(entries, list) or len(entries) != 2 or any(
                not isinstance(m, dict) or not isinstance(m.get("platform"), dict) for m in entries):
            raise ValueError("Release manifest must contain two platform descriptors")
        if any(m["platform"].get("os") != "linux" or m["platform"].get("architecture") not in ("amd64", "arm64") for m in entries):
            raise ValueError("Unsupported release manifest platform")
        platforms = {(m["platform"].get("os"), m["platform"].get("architecture")) for m in entries}
        if raw.get("schemaVersion") != 2 or platforms != {("linux", "amd64"), ("linux", "arm64")}:
            raise ValueError("Release manifest must contain exactly Linux AMD64 and ARM64")
        values = []
        for tag in (reference, image + ":sha-" + commit):
            digest = json.loads(run(["docker", "buildx", "imagetools", "inspect", tag,
                                     "--format", "{{json .Manifest.Digest}}"]).stdout)
            if not isinstance(digest, str) or not re.fullmatch(r"sha256:[0-9a-f]{64}", digest):
                raise ValueError("Invalid published manifest digest")
            values.append(digest)
        if values[0] != values[1]:
            raise ValueError("Semantic image tag does not match the released source tag")
        result[component] = values[0]
    return result


def publication_notes(reviewed, version, commit, manifests=None):
    reviewed = validate_reviewed_notes(reviewed)
    valid_version(version)
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Expected the full release source")
    repo = repo_name()
    images = "ghcr.io/" + repo.lower()
    highlights, limits = reviewed.split("### Known limits", 1)
    verification = ("Container build/scan gates and integrated smoke completed for the published manifests.\n"
                    if manifests else "Publication pending: image gates and digests have not been confirmed by these notes.\n")
    digests = "Digests will be added after verified image publication.\n"
    if manifests is not None:
        if set(manifests) != {"backend", "frontend"} or any(not re.fullmatch(r"sha256:[0-9a-f]{64}", value) for value in manifests.values()):
            raise ValueError("Both verified manifest digests are required")
        digests = ("- Backend digest: `" + manifests["backend"] + "`\n"
                   "- Frontend digest: `" + manifests["frontend"] + "`\n")
    run_id = os.environ.get("GITHUB_RUN_ID", "")
    workflow_url = ("https://github.com/" + repo + "/actions/runs/" + run_id if re.fullmatch(r"[1-9][0-9]*", run_id)
                    else "https://github.com/" + repo + "/actions/workflows/ci-containers.yml")
    return (highlights.rstrip() + "\n\n### Validation and supply chain\n\n" + verification
            + "Source: `" + commit + "`. Signed provenance and external SBOMs remain separate evidence.\n\n"
            "### Container images\n\n```bash\n"
            "docker pull " + images + "-backend:" + version + "\n"
            "docker pull " + images + "-frontend:" + version + "\n```\n\n"
            "Platforms: `linux/amd64`, `linux/arm64`.\n\n" + digests
            + "\n### Known limits" + limits.rstrip() + "\n\n"
            "Release publication does not deploy a VM or declare institutional acceptance.\n\n"
            "See the [full changelog](https://github.com/" + repo + "/blob/v" + version + "/CHANGELOG.md)"
            " and [publication workflow](" + workflow_url + ").\n")


def publish_release(version, commit, output):
    valid_version(version)
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Expected the full release source")
    if tag_target(api("git/ref/tags/v" + version)) != commit:
        raise ValueError("Tag/source mismatch")
    current = run(["gh", "release", "view", "v" + version, "--repo", repo_name(), "--json", "isDraft"], optional=True)
    if current.returncode == 0 and not json.loads(current.stdout)["isDraft"]:
        print("Published release preserved; no overwrite")
        return 0
    reviewed = source_reviewed_notes(commit, version)
    body = publication_notes(reviewed, version, commit, verified_manifests(version, commit))
    output.write_text(body, encoding="utf-8", newline="\n")
    if current.returncode == 0:
        command = ["gh", "release", "edit", "v" + version, "--draft=false", "--target", commit]
    else:
        command = ["gh", "release", "create", "v" + version, "--verify-tag", "--target", commit]
    run(command + ["--repo", repo_name(), "--title", version, "--notes-file", str(output)])
    print("GitHub Release published after verified manifests; no VM deployment performed")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prepare")
    p.add_argument("--bump", choices=("patch", "minor"), required=True)
    p.add_argument("--issue", required=True)
    p.add_argument("--plan", type=Path, required=True)
    p = sub.add_parser("propose")
    p.add_argument("--plan", type=Path, required=True)
    p = sub.add_parser("check-proposal")
    p.add_argument("--branch", required=True)
    p = sub.add_parser("tag")
    p.add_argument("--branch", required=True)
    p.add_argument("--commit", required=True)
    for name in ("notes", "publish"):
        p = sub.add_parser(name)
        p.add_argument("--version", required=True)
        p.add_argument("--commit", required=True)
        p.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    if args.command == "check-proposal":
        if "-release-v" in args.branch:
            version = branch_version(args.branch)
            notes(Path("CHANGELOG.md").read_text(encoding="utf-8"), version)
            validate_reviewed_notes(Path("docs/releases", version + ".md").read_text(encoding="utf-8"))
            print("Version-specific release notes reviewed in the proposal")
        return 0
    if args.command == "prepare":
        path = Path("CHANGELOG.md")
        text, plan = prepare(path.read_text(encoding="utf-8"), args.bump, args.issue,
                             datetime.now(ZoneInfo("America/Fortaleza")).date().isoformat())
        note_path = Path("docs/releases") / (plan["version"] + ".md")
        if note_path.exists():
            raise ValueError("Reviewed notes already exist; refusing overwrite")
        path.write_text(text, encoding="utf-8", newline="\n")
        note_path.parent.mkdir(parents=True, exist_ok=True)
        note_path.write_text(review_template(notes(text, plan["version"]), plan["version"]), encoding="utf-8", newline="\n")
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
        run(["git", "add", "--", "CHANGELOG.md", "docs/releases/" + version + ".md"])
        run(["git", "commit", "-m", "chore(release): prepare v" + version, "-m", "Refs #" + str(plan["issue"])])
        run(["git", "push", "origin", "HEAD:refs/heads/" + plan["branch"]])
        body = "Prepare the incorporated changelog for v" + version + ".\n\nRefs #" + str(plan["issue"]) + ".\n\nDraft only: review docs/releases/" + version + ".md, replace the review marker with version-specific highlights/limits, verify composition, approve pending workflow runs when GitHub requests it, and review all required checks before merge. This does not publish or deploy. The existing container gates remain mandatory."
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
        source_notes(args.commit, version)
        existing_tag = api("git/ref/tags/v" + version, allow_missing=True)
        if existing_tag:
            if tag_target(existing_tag) != args.commit:
                raise ValueError("Immutable release tag points to another commit; refusing overwrite")
            existing_release = run(["gh", "release", "view", "v" + version, "--repo", repo_name(), "--json", "isDraft"], optional=True)
            if existing_release.returncode == 0 and not json.loads(existing_release.stdout)["isDraft"]:
                print("Tag and published release already match; no rebuild or overwrite")
                return 0
        body = source_reviewed_notes(args.commit, version)
        verify_or_create_tag(version, args.commit, body)
        run(["gh", "workflow", "run", "ci-containers.yml", "--repo", repo_name(), "--ref", "v" + version])
        print("Immutable tag verified; container pipeline explicitly dispatched. No release or VM promotion claimed.")
    else:
        version = valid_version(args.version)
        if args.command == "publish":
            return publish_release(version, args.commit, args.output)
        reviewed = source_reviewed_notes(args.commit, version)
        args.output.write_text(publication_notes(reviewed, version, args.commit), encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.TimeoutExpired:
        print("Release operation exceeded the bounded timeout", file=__import__('sys').stderr)
        raise SystemExit(1)
    except (ValueError, RuntimeError, OSError) as error:
        print(str(error), file=__import__('sys').stderr)
        raise SystemExit(1)
