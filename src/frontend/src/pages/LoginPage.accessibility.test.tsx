import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SessionProvider } from "../features/authentication";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { LoginPage } from "./LoginPage";

describe("LoginPage accessibility", () => {
  it("does not globally scale the login composition", () => {
    const stylesheet = readFileSync(resolve("src/index.css"), "utf8");

    expect(stylesheet).not.toMatch(/\bzoom\s*:/i);
    expect(stylesheet).not.toMatch(/transform\s*:\s*[^;{}]*scale\s*\(/i);
  });

  it("keeps the page vertically scrollable on short viewports", async () => {
    const { container } = render(
      <SessionProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );

    await screen.findByRole("heading", { name: /bem-vindo\(a\)!/i });

    const main = container.querySelector("main");

    expect(main).toHaveClass("login-page", "overflow-x-hidden");
    expect(main).not.toHaveClass("overflow-hidden");
    expect(container.querySelector(".login-shell")).toBeInTheDocument();
  });

  it("preserves the official IFPE brand and treats the campus photo as decorative", async () => {
    const { container } = render(
      <SessionProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );

    expect(
      await screen.findByAltText(
        "Instituto Federal de Pernambuco, Campus Belo Jardim",
      ),
    ).toHaveAttribute("src", "/brand/ifpe-horizontal.png");

    expect(
      container.querySelector('img[src="/brand/campus-gatehouse.jpg"]'),
    ).toHaveAttribute("alt", "");
  });

  it("preserves the semantic structure and keyboard focus order", async () => {
    const user = userEvent.setup();

    render(
      <SessionProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /bem-vindo\(a\)!/i,
        level: 1,
      }),
    ).toBeInTheDocument();

    const email = screen.getByRole("textbox", { name: /e-mail/i });
    const password = screen.getByLabelText("Senha:");
    const submit = screen.getByRole("button", { name: /entrar/i });

    expect(email.compareDocumentPosition(password)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(password.compareDocumentPosition(submit)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(email).toHaveFocus();

    await user.tab();
    expect(password).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toHaveFocus();

    await user.tab();
    expect(submit).toHaveFocus();
  });

  it("provides direct account guidance without outdated browser-storage guidance", async () => {
    render(
      <SessionProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );

    expect(
      await screen.findByText(
        "Utilize a conta individual cadastrada pelo administrador.",
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
