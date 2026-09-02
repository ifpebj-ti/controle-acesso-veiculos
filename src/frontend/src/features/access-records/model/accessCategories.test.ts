import { describe, expect, it } from "vitest";

import { generalAccessCategories } from "./accessCategories";

describe("generalAccessCategories", () => {
  it("keeps the frontend list focused on the documented general flow", () => {
    expect(generalAccessCategories).toEqual([
      "Visitante",
      "Prestador de serviço",
      "Entrega",
      "Evento",
      "Outro acesso autorizado",
    ]);
  });

  it("does not expose duplicate categories", () => {
    expect(new Set(generalAccessCategories).size).toBe(
      generalAccessCategories.length,
    );
  });
});
