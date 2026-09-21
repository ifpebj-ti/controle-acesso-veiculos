import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentState } from "./ContentState";

describe("ContentState", () => {
  it("announces loading without exposing the decorative indicator", () => {
    render(
      <ContentState title="Carregando dados fictícios…" variant="loading" />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregando dados fictícios…",
    );
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("announces an error and keeps its recovery action available", () => {
    render(
      <ContentState
        action={<button type="button">Tentar novamente</button>}
        description="Os dados anteriores permanecem disponíveis."
        title="Não foi possível atualizar"
        variant="error"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível atualizar",
    );
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeEnabled();
  });

  it("presents an empty state without creating an unnecessary live region", () => {
    const { container } = render(
      <ContentState
        description="Revise os filtros."
        icon="search"
        title="Nenhum resultado encontrado"
        variant="empty"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Nenhum resultado encontrado" }),
    ).toBeInTheDocument();
    expect(container.querySelector("[role]")).not.toBeInTheDocument();
  });
});
