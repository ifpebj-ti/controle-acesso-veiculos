import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SessionProvider } from "../features/authentication";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { LoginPage } from "./LoginPage";

describe("LoginPage accessibility", () => {
  it("keeps functional content available to vertical page flow", async () => {
    render(
      <SessionProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );

    const email = await screen.findByRole("textbox", { name: "E-mail:" });
    const main = email.closest("main");

    expect(main).toHaveClass("overflow-x-hidden");
    expect(main).not.toHaveClass("overflow-hidden");
    expect(screen.getByLabelText("Senha:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sua sessão é protegida e pode ser restaurada com segurança enquanto estiver válida.",
      ),
    ).toBeInTheDocument();
  });

  it("describes session restoration without outdated browser-storage guidance", async () => {
    render(
      <SessionProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );

    expect(
      await screen.findByText(
        "Sua sessão é protegida e pode ser restaurada com segurança enquanto estiver válida.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/será encerrada ao atualizar ou fechar/i),
    ).not.toBeInTheDocument();
  });

  it("has no serious automated accessibility violations", async () => {
    const { container } = render(
      <SessionProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );

    await expectNoSeriousAccessibilityViolations(container);
  });
});
