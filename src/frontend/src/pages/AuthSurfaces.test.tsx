import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { SessionLoadingState } from "../components/ui/SessionLoadingState";
import { SessionContext } from "../features/authentication/session/SessionContext";
import type { SessionEndReason } from "../features/authentication";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { LoginPage } from "./LoginPage";
import { NotFoundPage } from "./NotFoundPage";

function renderLogin(sessionEndReason: SessionEndReason | null = null) {
  const login = vi.fn();
  const view = render(
    <SessionContext.Provider
      value={{
        completePasswordChange: vi.fn(),
        login,
        logout: vi.fn(),
        expiresAtUtc: null,
        sessionEndReason,
        sessionNotice: null,
        status: "unauthenticated",
        user: null,
      }}
    >
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </SessionContext.Provider>,
  );
  return { ...view, login };
}

describe("Modernized authentication surfaces", () => {
  it.each<SessionEndReason>([
    "expired",
    "inactive",
    "logout-unconfirmed",
    "password-changed",
    "restoration-unavailable",
    "unauthorized",
  ])(
    "keeps the %s message announced and associated with initial focus",
    (reason) => {
      renderLogin(reason);
      const message = screen.getByRole("alert");
      const email = screen.getByLabelText("E-mail:");
      expect(message.textContent).not.toBe("");
      expect(email).toHaveAttribute("aria-describedby", message.id);
      expect(email).toHaveFocus();
      expect(email).toHaveClass("ui-field");
      expect(screen.getByRole("button", { name: "Entrar" })).toHaveClass(
        "ui-button",
      );
    },
  );

  it("preserves keyboard validation and refs without sending an invalid login", async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.tab();
    expect(screen.getByLabelText("Senha:")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toHaveFocus();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(await screen.findByText("Informe seu e-mail.")).toBeVisible();
    expect(screen.getByLabelText("E-mail:")).toHaveFocus();
    expect(screen.getByLabelText("E-mail:")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(login).not.toHaveBeenCalled();
  });

  it("shows and hides the password without changing its value", async () => {
    const user = userEvent.setup();
    renderLogin();
    const password = screen.getByLabelText("Senha:");

    await user.type(password, "test-only-password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("test-only-password");

    await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("submits with Enter and exposes the loading and filled states", async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    login.mockReturnValue(new Promise(() => undefined));
    const email = screen.getByLabelText("E-mail:");
    const password = screen.getByLabelText("Senha:");

    await user.type(email, "porteiro@example.test");
    await user.type(password, "test-only-password{Enter}");

    expect(email).toHaveAttribute("data-filled", "true");
    expect(password).toHaveAttribute("data-filled", "true");
    expect(login).toHaveBeenCalledWith({
      email: "porteiro@example.test",
      password: "test-only-password",
    });
    expect(screen.getByRole("button", { name: "Entrando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Entrando..." })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("announces a malformed email next to its field", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("E-mail:"), "email-invalido");
    await user.type(screen.getByLabelText("Senha:"), "test-only-password");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const error = await screen.findByText("Informe um e-mail válido.");
    expect(error).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText("E-mail:")).toHaveAttribute(
      "aria-describedby",
      "email-error",
    );
  });

  it("provides a heading and an announced, reduced-motion loading state", async () => {
    const { container } = render(
      <SessionLoadingState title="Verificando sua sessão" />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Verificando sua sessão",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Aguarde");
    expect(
      container.querySelector(".motion-reduce\\:animate-none"),
    ).toBeInTheDocument();
    await expectNoSeriousAccessibilityViolations(container);
  });

  it.each(["denied", "not-found"])(
    "keeps %s semantic, accessible and keyboard navigable",
    async (state) => {
      const user = userEvent.setup();
      const { container } = render(
        <MemoryRouter>
          {state === "denied" ? (
            <main>
              <AccessDeniedState />
            </main>
          ) : (
            <NotFoundPage />
          )}
        </MemoryRouter>,
      );
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      const link = screen.getByRole("link", { name: "Voltar à visão geral" });
      expect(link).toHaveAttribute("href", "/visao-geral");
      expect(link).toHaveClass("ui-button");
      await user.tab();
      expect(link).toHaveFocus();
      await expectNoSeriousAccessibilityViolations(container);
    },
  );

  it("keeps scoped surfaces on semantic tokens without global scaling or decorative blur", () => {
    const paths = [
      "pages/LoginPage.tsx",
      "pages/PasswordChangePage.tsx",
      "pages/NotFoundPage.tsx",
      "components/layout/AppLayout.tsx",
      "components/ui/AccessDeniedState.tsx",
      "components/ui/SessionLoadingState.tsx",
      "features/authentication/components/PasswordChangeForm.tsx",
    ];
    for (const path of paths) {
      const source = readFileSync(resolve("src", path), "utf8");
      expect(source, path).not.toMatch(
        /(?:bg|text|border)-(?:white|cream|red-\d|amber-\d)|bg-brand-soft|backdrop-blur|#[\da-f]{6}/i,
      );
      expect(source, path).not.toMatch(
        /(?:localStorage|sessionStorage)\.(?:setItem|getItem)/,
      );
      expect(source, path).not.toMatch(/overflow-y-hidden|\bzoom\s*:|scale\(/);
    }
  });
});
