import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionHeader } from "./SectionHeader";

describe("SectionHeader", () => {
  it("keeps the shared spacing and optional context", () => {
    render(
      <SectionHeader
        description="Descrição fictícia da seção."
        eyebrow="Contexto fictício"
        meta={<p>2 resultados</p>}
        title="Título da seção"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Título da seção" }),
    ).toHaveClass("mt-3");
    expect(screen.getByText("Descrição fictícia da seção.")).toHaveClass(
      "mt-2",
    );
    expect(screen.getByText("2 resultados")).toBeInTheDocument();
  });
});
