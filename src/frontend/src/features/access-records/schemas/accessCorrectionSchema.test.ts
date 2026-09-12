import { describe, expect, it } from "vitest";

import { accessCorrectionFormSchema } from "./accessRecordSchemas";

const validCorrection = {
  categoryName: "Visitante",
  justification: "Justificativa fictícia válida.",
  objective: "Atendimento fictício",
  observation: "Observação fictícia",
};

describe("accessCorrectionFormSchema", () => {
  it("accepts the canonical categories and an optional empty observation", () => {
    expect(
      accessCorrectionFormSchema.safeParse({
        ...validCorrection,
        categoryName: "Mototáxi",
        observation: "",
      }).success,
    ).toBe(true);
  });

  it.each([
    ["objective", "", false],
    ["objective", "x".repeat(501), false],
    ["categoryName", "Categoria inventada", false],
    ["observation", "x".repeat(1001), false],
    ["justification", "curta", false],
    ["justification", "x".repeat(501), false],
  ])("rejects an invalid %s", (field, value) => {
    expect(
      accessCorrectionFormSchema.safeParse({
        ...validCorrection,
        [field]: value,
      }).success,
    ).toBe(false);
  });
});
