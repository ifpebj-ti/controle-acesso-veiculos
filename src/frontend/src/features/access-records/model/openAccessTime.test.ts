import { describe, expect, it } from "vitest";

import { formatElapsedTime } from "./openAccessTime";

describe("formatElapsedTime", () => {
  const now = new Date("2026-09-11T15:30:00.000Z");

  it.each([
    ["2026-09-11T15:29:30.000Z", "menos de 1 min"],
    ["2026-09-11T15:18:00.000Z", "12 min"],
    ["2026-09-11T13:25:00.000Z", "2 h 05 min"],
    ["2026-09-10T12:30:00.000Z", "1 d 3 h"],
    ["2026-09-11T15:31:00.000Z", "menos de 1 min"],
    ["invalid", "Não disponível"],
  ])("formats %s as %s", (entryAtUtc, expected) => {
    expect(formatElapsedTime(entryAtUtc, now)).toBe(expected);
  });
});
