import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("keeps a clear separation between the eyebrow and page title", () => {
    render(
      <PageHeader
        description="Descrição fictícia da página."
        eyebrow="Contexto fictício"
        title="Título fictício"
      />,
    );

    expect(screen.getByText("Contexto fictício")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Título fictício" }),
    ).toHaveClass("mt-2");
  });
});
