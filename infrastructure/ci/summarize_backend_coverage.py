"""Union executable backend lines from existing Cobertura reports; stdlib only."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

PROJECTS = ("ControleAcessoVeiculos.Domain", "ControleAcessoVeiculos.Application",
            "ControleAcessoVeiculos.Infrastructure", "ControleAcessoVeiculos.API")


def source_name(value):
    name = value.replace("\\", "/")
    marker = "/src/backend/"
    if marker in name:
        name = name.split(marker, 1)[1]
    elif name.startswith("src/backend/"):
        name = name[len("src/backend/"):]
    project = name.split("/", 1)[0]
    if project not in PROJECTS or "/obj/" in name or "/bin/" in name or "/Data/Migrations/" in name:
        return None
    if ".." in name.split("/") or not name.endswith(".cs"):
        raise ValueError("Invalid source path in coverage report")
    return name


def consolidate(directory):
    reports = sorted(Path(directory).rglob("*.cobertura.xml"))
    if not reports:
        raise ValueError("No Cobertura reports found")
    hits, seen = {}, set()
    for report in reports:
        if report.stat().st_size > 20_000_000:
            raise ValueError("Coverage report exceeds bounded input size")
        raw = report.read_bytes()
        xml = raw.decode("utf-8-sig")
        if "<!DOCTYPE" in xml.upper() or "<!ENTITY" in xml.upper():
            raise ValueError("XML declarations with entities are not accepted")
        digest = hashlib.sha256(raw).hexdigest()
        if digest in seen:
            continue
        seen.add(digest)
        root = ET.fromstring(xml)
        if root.tag != "coverage":
            raise ValueError("Expected Cobertura coverage root")
        for cls in root.findall("./packages/package/classes/class"):
            name = source_name(cls.get("filename", ""))
            if name is None:
                continue
            for line in cls.findall("./lines/line"):
                number, count = int(line.get("number", "0")), int(line.get("hits", "-1"))
                if number <= 0 or count < 0:
                    raise ValueError("Invalid executable line or hit count")
                key = (name, number)
                hits[key] = hits.get(key, False) or count > 0
    projects = {}
    for project in PROJECTS:
        values = [hit for (name, _), hit in hits.items() if name.startswith(project + "/")]
        if not values:
            raise ValueError("Missing executable coverage for " + project)
        projects[project] = metric(values)
    result = metric(list(hits.values()))
    result.update(projects=projects, uniqueReports=len(seen), inputReports=len(reports),
                  scope="Executable handwritten backend lines; union across suites; excludes tests, bin/obj and generated EF migrations. Frontend and branch coverage are not measured.")
    return result


def metric(values):
    covered, valid = sum(values), len(values)
    return {"covered": covered, "valid": valid, "percent": round(100 * covered / valid, 4)}


def markdown(result, minimum):
    lines = ["## Backend executable-line coverage", "",
             "| Scope | Covered | Valid | Lines |", "| --- | ---: | ---: | ---: |"]
    for name, value in [("Backend", result), *result["projects"].items()]:
        lines.append(f"| {name} | {value['covered']} | {value['valid']} | {value['percent']:.2f}% |")
    lines.extend(["", f"Minimum backend line coverage: {minimum:g}%.", "", result["scope"],
                  "", "Generated migrations remain covered by migration/restore tests but do not inflate this handwritten-code metric.",
                  "This does not satisfy the separate 90% critical-branch target or prove correctness/security.", ""])
    return "\n".join(lines)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--minimum-lines", type=float, default=70)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    if not math.isfinite(args.minimum_lines) or not 0 <= args.minimum_lines <= 100:
        parser.error("minimum must be finite and within 0..100")
    try:
        result = consolidate(args.directory)
    except (ValueError, OSError, ET.ParseError) as error:
        print("Coverage input rejected: " + str(error), file=sys.stderr)
        return 2
    args.output.mkdir(parents=True, exist_ok=True)
    result["minimumLines"] = args.minimum_lines
    # Do not round a value up across the gate boundary.
    passed = 100 * result["covered"] >= args.minimum_lines * result["valid"]
    result["passed"] = passed
    (args.output / "summary.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    (args.output / "summary.md").write_text(markdown(result, args.minimum_lines), encoding="utf-8")
    print(f"Backend lines: {result['covered']}/{result['valid']} ({result['percent']:.2f}%), minimum {args.minimum_lines:g}%")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
