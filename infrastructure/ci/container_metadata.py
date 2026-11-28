"""Identify the checked-out application source, never the inherited base image."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess

SOURCE = "https://github.com/ifpebj-ti/controle-acesso-veiculos"
VERSION = r"(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)"


def metadata(ref, revision):
    if not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise ValueError("Expected the full checked-out commit SHA")
    if ref.startswith("refs/tags/"):
        match = re.fullmatch(r"refs/tags/v(" + VERSION + r")", ref)
        if not match:
            raise ValueError("Expected a canonical semantic release tag")
        version = match.group(1)
    elif ref.startswith(("refs/heads/", "refs/pull/")):
        version = "dev-" + revision
    else:
        raise ValueError("Unsupported build reference")
    return {"version": version, "revision": revision}


def verify(labels, expected):
    required = {"org.opencontainers.image.version": expected["version"],
                "org.opencontainers.image.revision": expected["revision"],
                "org.opencontainers.image.source": SOURCE}
    if any(labels.get(key) != value for key, value in required.items()):
        raise ValueError("Application OCI labels do not match the checked-out source")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-image")
    args = parser.parse_args()
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True, encoding="utf-8").strip()
    expected = metadata(os.environ["GITHUB_REF"], revision)
    if args.verify_image:
        raw = subprocess.check_output(["docker", "image", "inspect", args.verify_image], text=True, encoding="utf-8")
        image = json.loads(raw)[0]
        verify(image["Config"].get("Labels") or {}, expected)
        print("Application image version, revision and source verified")
    else:
        with Path(os.environ["GITHUB_OUTPUT"]).open("a", encoding="utf-8", newline="\n") as out:
            for key, value in expected.items():
                out.write(key + "=" + value + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
