/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(process.cwd(), "src/styles/primitives.css"),
  "utf8",
);

describe("shared visual contract", () => {
  it("uses semantic colors without globally scaling controls", () => {
    expect(css).not.toMatch(/#[\da-f]{3,8}\b|rgba?\(|zoom\s*:|scale\(/i);
    expect(css).toContain("min-height: 3rem");
    expect(css).toContain("outline: 3px solid var(--ui-focus)");
    expect(css).toContain("var(--ui-disabled-surface)");
    expect(css).toContain("var(--ui-disabled-text)");
    expect(css).toContain("var(--ui-disabled-border)");
    expect(css).toContain("forced-colors: active");
  });

  it.each([
    "SelectField",
    "ConfirmationProvider",
    "ContentState",
    "StatusBadge",
    "PageHeader",
    "SectionHeader",
  ])("keeps %s free of legacy color utilities", (name) => {
    const source = readFileSync(
      resolve(process.cwd(), `src/components/ui/${name}.tsx`),
      "utf8",
    );
    expect(source).not.toMatch(
      /(?:bg|text|border|ring)-(?:white|cream|ink|brand|red|amber|emerald|slate)(?:\W|$)/,
    );
    expect(source).not.toMatch(/#[\da-f]{3,8}\b|rgba?\(/i);
  });
});
