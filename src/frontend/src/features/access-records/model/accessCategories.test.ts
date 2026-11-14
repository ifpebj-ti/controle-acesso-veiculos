import { describe, expect, it } from "vitest";

import {
  generalAccessCategories,
  generalAccessCategoryOptions,
  getAccessCategoryLabel,
  toAccessCategoryFilter,
} from "./accessCategories";

describe("generalAccessCategories", () => {
  it("displays Servidor federal while preserving the canonical Federal value", () => {
    expect(generalAccessCategoryOptions).toContainEqual({
      label: "Servidor federal",
      value: "Federal",
    });
    expect(getAccessCategoryLabel("Federal")).toBe("Servidor federal");
    expect(getAccessCategoryLabel("Categoria histórica")).toBe(
      "Categoria histórica",
    );
    expect(toAccessCategoryFilter(" SERVIDOR FEDERAL ")).toBe("Federal");
    expect(toAccessCategoryFilter("Serv")).toBe("Serv");
    expect(toAccessCategoryFilter(" alun ")).toBe("alun");
  });
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
