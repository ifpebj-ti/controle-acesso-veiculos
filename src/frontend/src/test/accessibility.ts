import axe, { type AxeResults, type RunOptions } from "axe-core";
import { expect } from "vitest";

const jsdomOptions: RunOptions = {
  rules: {
    "color-contrast": { enabled: false },
    "link-in-text-block": { enabled: false },
  },
};

function summarizeViolations(violations: AxeResults["violations"]) {
  return violations.map((violation) => ({
    help: violation.help,
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.flatMap((node) => node.target),
  }));
}

export async function expectNoSeriousAccessibilityViolations(
  container: HTMLElement,
) {
  const results = await axe.run(container, jsdomOptions);
  const blockingViolations = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );

  expect(summarizeViolations(blockingViolations)).toEqual([]);
}
