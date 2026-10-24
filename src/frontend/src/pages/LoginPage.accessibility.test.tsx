import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SessionProvider } from "../features/authentication";
import { AppearanceProvider } from "../features/appearance";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { api } from "../services/api";
import { LoginPage } from "./LoginPage";

beforeEach(() => {
  vi.spyOn(api, "get").mockResolvedValue({
    data: { googleEnabled: true },
  });
});

afterEach(() => vi.restoreAllMocks());

describe("LoginPage accessibility", () => {
  it("does not globally scale the login composition", () => {
    const stylesheet = readFileSync(resolve("src/index.css"), "utf8");

    expect(stylesheet).not.toMatch(/\bzoom\s*:/i);
    expect(stylesheet).not.toMatch(/transform\s*:\s*[^;{}]*scale\s*\(/i);
  });

  it("keeps the page vertically scrollable on short viewports", async () => {
    const { container } = render(
      <AppearanceProvider>
        <SessionProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </SessionProvider>
      </AppearanceProvider>,
    );

    await screen.findByRole("heading", { name: /bem-vindo\(a\)!/i });

    const main = container.querySelector("main");
    const shell = container.querySelector(".login-shell");
    const composition = container.querySelector(".login-composition");

    expect(main).toHaveClass("login-page", "overflow-x-hidden");
    expect(main).not.toHaveClass("overflow-hidden");
    expect(shell).toHaveClass("min-h-svh", "w-full");
    expect(composition).toHaveClass("min-h-svh", "w-full");
    expect(composition).not.toHaveClass("rounded-[1.75rem]", "shadow-2xl");
  });

  it("preserves the official IFPE brand and treats the campus photo as decorative", async () => {
    const { container } = render(
      <AppearanceProvider>
        <SessionProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </SessionProvider>
      </AppearanceProvider>,
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

  it("places the photo before the form visually on mobile and restores the side-by-side order on desktop", async () => {
    const { container } = render(
      <AppearanceProvider>
        <SessionProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </SessionProvider>
      </AppearanceProvider>,
    );

    await screen.findByRole("heading", { name: /bem-vindo\(a\)!/i });

    expect(container.querySelector(".login-visual")).toHaveClass(
      "order-1",
      "flex",
      "lg:order-2",
    );
    expect(container.querySelector(".login-form-panel")).toHaveClass(
      "order-2",
      "lg:order-1",
    );
    const dividers = container.querySelectorAll(".login-visual-divider");

    expect(dividers).toHaveLength(2);
    expect(dividers[0]).toHaveClass("login-visual-divider--desktop");
    expect(dividers[1]).toHaveClass("login-visual-divider--mobile");
    dividers.forEach((divider) => {
      expect(divider).toHaveAttribute("aria-hidden", "true");
      expect(divider).toHaveAttribute("preserveAspectRatio", "none");
    });
    expect(container.querySelectorAll(".login-visual-road-line")).toHaveLength(
      2,
    );
  });

  it("preserves the semantic structure and keyboard focus order", async () => {
    const user = userEvent.setup();

    render(
      <AppearanceProvider>
        <SessionProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </SessionProvider>
      </AppearanceProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /bem-vindo\(a\)!/i,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Aparência" }),
    ).not.toBeInTheDocument();

    const google = await screen.findByRole("button", {
      name: "Continuar com Google",
    });
    const administrativeAccess = screen.getByRole("button", {
      name: "Acesso administrativo",
    });
    expect(google.compareDocumentPosition(administrativeAccess)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    await user.click(administrativeAccess);

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
      <AppearanceProvider>
        <SessionProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </SessionProvider>
      </AppearanceProvider>,
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
    const user = userEvent.setup();
    const { container } = render(
      <AppearanceProvider>
        <SessionProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </SessionProvider>
      </AppearanceProvider>,
    );

    await screen.findByRole("button", { name: "Continuar com Google" });
    await expectNoSeriousAccessibilityViolations(container);

    await user.click(
      screen.getByRole("button", { name: "Acesso administrativo" }),
    );
    await expectNoSeriousAccessibilityViolations(container);
  });
});
