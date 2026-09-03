import { describe, expect, it } from "vitest";

import { generalAccessCategories } from "./accessCategories";

describe("generalAccessCategories", () => {
  it("matches the nine canonical categories accepted by the backend", () => {
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
    ]);
  });

  it("does not expose duplicate categories", () => {
    expect(new Set(generalAccessCategories).size).toBe(
      generalAccessCategories.length,
    );
  });
});
