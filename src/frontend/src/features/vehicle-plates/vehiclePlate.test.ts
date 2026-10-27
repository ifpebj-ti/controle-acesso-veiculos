import { describe, expect, it } from "vitest";

import {
  formatVehiclePlateInput,
  isValidVehiclePlate,
  normalizeVehiclePlate,
} from "./vehiclePlate";

describe("vehicle plate policy", () => {
  it.each(["ABC1234", "abc-1234", "ABC 1234", "ABC1D23", "abc-1d23"])(
    "accepts the supported Brazilian format %s",
    (plate) => {
      expect(isValidVehiclePlate(plate)).toBe(true);
    },
  );

  it.each([
    "777777",
    "AB12345",
    "ABCD123",
    "ABC12D3",
    "ABC123",
    "ABC12345",
    "ÁBC1234",
    "ABC@123",
  ])("rejects the unsupported format %s", (plate) => {
    expect(isValidVehiclePlate(plate)).toBe(false);
  });

  it("normalizes accepted separators and case to the backend representation", () => {
    expect(normalizeVehiclePlate(" abc - 1d23 ")).toBe("ABC1D23");
  });

  it("uses the conventional visual separator only for a complete legacy plate", () => {
    expect(formatVehiclePlateInput("abc 1234")).toBe("ABC-1234");
    expect(formatVehiclePlateInput("abc-1d23")).toBe("ABC1D23");
  });
});
