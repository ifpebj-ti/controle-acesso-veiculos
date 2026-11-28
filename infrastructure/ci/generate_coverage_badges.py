"""Generate backend coverage badges from the test platform's merged report."""
import argparse
from pathlib import Path
import xml.etree.ElementTree as ET


def generate(results, output):
    reports = sorted((results / "merged").glob("merged-*.cobertura.xml"))
    if len(reports) != 1:
        raise ValueError("Expected one merged Cobertura report")
    report = ET.parse(reports[0]).getroot()
    if report.tag != "coverage":
        raise ValueError("Expected a Cobertura coverage root")

    badges = {}
    for metric in ("lines", "branches"):
        covered = int(report.attrib[f"{metric}-covered"])
        total = int(report.attrib[f"{metric}-valid"])
        if total <= 0 or not 0 <= covered <= total:
            raise ValueError(f"Invalid Cobertura {metric} counts")
        value = f"{covered / total:.1%}"
        name = f"coverage-{metric}"
        color = "#216e39" if covered * 10 >= total * 9 else "#825000"
        badges[name] = f"""<svg xmlns="http://www.w3.org/2000/svg" width="174" height="20" role="img" aria-label="{name}: {value}">
  <title>{name}: {value}</title>
  <rect width="174" height="20" fill="#333"/>
  <rect x="118" width="56" height="20" fill="{color}"/>
  <g fill="#fff" font-family="Verdana, sans-serif" font-size="11" text-anchor="middle">
    <text x="59" y="14">{name}</text>
    <text x="146" y="14">{value}</text>
  </g>
</svg>
"""
    output.mkdir(parents=True, exist_ok=True)
    for name, svg in badges.items():
        (output / f"{name}.svg").write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("results", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    generate(args.results, args.output)
