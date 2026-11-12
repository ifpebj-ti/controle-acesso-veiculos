import { describe, expect, it } from "vitest";

import { generalAccessCategories } from "./accessCategories";

describe("generalAccessCategories", () => {
  it("preserves the existing categories and appends the three requested options", () => {
    expect(generalAccessCategories).toEqual([
      "Visitante",
      "Prestador de serviço",
      "Entrega",
      "Evento",
      "Treino ou jogo",
      "Caminhada com veículo",
      "Mototáxi",
      "Permanência excepcional",
      "Outro acesso autorizado",
      "Aluno",
      "Terceirizado",
      "Federal",
    ]);
  });

  it("does not expose duplicate categories", () => {
    expect(new Set(generalAccessCategories).size).toBe(
      generalAccessCategories.length,
    );
  });
});
