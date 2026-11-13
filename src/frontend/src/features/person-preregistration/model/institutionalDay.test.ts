import { describe, expect, it } from "vitest";
import {
  institutionalDayKey,
  nextInstitutionalMidnight,
} from "./institutionalDay";
describe("current institutional day", () => {
  it("keeps the previous institutional date before 03:00 UTC and resets at local midnight", () => {
    const before = new Date("2026-11-13T02:59:00Z");
    expect(institutionalDayKey(before)).toBe("2026-11-12");
    expect(nextInstitutionalMidnight(before)).toBe(
      Date.parse("2026-11-13T03:00:00Z"),
    );
    expect(institutionalDayKey(new Date("2026-11-13T03:00:00Z"))).toBe(
      "2026-11-13",
    );
  });
  it("handles the month/year boundary rather than retaining a rolling 24-hour window", () => {
    expect(nextInstitutionalMidnight(new Date("2026-12-31T20:00:00Z"))).toBe(
      Date.parse("2027-01-01T03:00:00Z"),
    );
  });
});
