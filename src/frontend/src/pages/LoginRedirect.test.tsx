import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "../features/authentication/services/authenticationService",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../features/authentication/services/authenticationService")
    >()),
    getAuthenticationProviders: vi.fn(async () => ({ googleEnabled: true })),
  }),
);

import { AppearanceProvider } from "../features/appearance";
import { SessionContext } from "../features/authentication/session/SessionContext";
import type {
  AuthenticatedUser,
  ProfileName,
} from "../features/authentication/types";
import { LoginPage } from "./LoginPage";

const userFor = (
  profileName: ProfileName,
  requiresPasswordChange = false,
): AuthenticatedUser => ({
  id: 42,
  email: "fictitious@example.test",
  profileName,
  requiresPasswordChange,
});

function renderLogin(
  result: AuthenticatedUser,
  requestedPath: unknown,
  mode: "restored" | "callback" | "local" = "restored",
) {
  const login = vi.fn().mockResolvedValue(result);
  const restoreExternalSession = vi.fn().mockResolvedValue(result);
  render(
    <AppearanceProvider>
      <SessionContext.Provider
        value={{
          completePasswordChange: vi.fn(),
          expiresAtUtc: null,
          login,
          logout: vi.fn(),
          restoreExternalSession,
          sessionEndReason: null,
          sessionNotice: null,
          status: mode === "restored" ? "authenticated" : "unauthenticated",
          user: mode === "restored" ? result : null,
        }}
      >
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/login",
              search: mode === "callback" ? "?status=success" : "",
              state: { from: { pathname: requestedPath } },
            },
          ]}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {[
              "/visao-geral",
              "/conta/senha",
              "/acessos/historico",
              "/relatorios",
              "/administracao",
            ].map((path) => (
              <Route key={path} path={path} element={<h1>{path}</h1>} />
            ))}
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </AppearanceProvider>,
  );
  return { login, restoreExternalSession };
}

beforeEach(() => vi.clearAllMocks());

describe("login return navigation", () => {
  it.each([
    ["Porteiro", "/relatorios"],
    ["Porteiro", "/administracao"],
    ["Vigilante", "/relatorios"],
    ["SetorTransporte", "/administracao"],
    ["Porteiro", "/conta/senha"],
    ["Administrador", "https://example.test"],
    ["Administrador", "//example.test"],
    ["Administrador", "/desconhecida"],
    ["Administrador", undefined],
    ["Administrador", { path: "/relatorios" }],
  ] as const)(
    "uses overview for incompatible or unrecognized return (%s, %s)",
    async (profile, path) => {
      renderLogin(userFor(profile), path);
      expect(
        await screen.findByRole("heading", { name: "/visao-geral" }),
      ).toBeInTheDocument();
    },
  );

  it.each(["restored", "callback"] as const)(
    "preserves an allowed return after %s authentication",
    async (mode) => {
      renderLogin(userFor("Porteiro"), "/acessos/historico", mode);
      expect(
        await screen.findByRole("heading", { name: "/acessos/historico" }),
      ).toBeInTheDocument();
    },
  );

  it("uses the Google callback identity instead of the old administrative destination", async () => {
    const { restoreExternalSession } = renderLogin(
      userFor("Porteiro"),
      "/relatorios",
      "callback",
    );
    expect(
      await screen.findByRole("heading", { name: "/visao-geral" }),
    ).toBeInTheDocument();
    expect(restoreExternalSession).toHaveBeenCalledOnce();
  });

  it.each(["restored", "callback", "local"] as const)(
    "prioritizes the API mandatory password flag for %s",
    async (mode) => {
      const { login } = renderLogin(
        userFor("Administrador", true),
        "/relatorios",
        mode,
      );
      if (mode === "local") {
        const keyboard = userEvent.setup();
        await keyboard.click(
          await screen.findByRole("button", {
            name: "Entrar com usuário e senha",
          }),
        );
        await keyboard.type(
          screen.getByLabelText("E-mail:"),
          "fictitious@example.test",
        );
        await keyboard.type(
          screen.getByLabelText("Senha:"),
          "fictitious-test-only-password",
        );
        await keyboard.click(screen.getByRole("button", { name: "Entrar" }));
        expect(login).toHaveBeenCalledOnce();
      }
      expect(
        await screen.findByRole("heading", { name: "/conta/senha" }),
      ).toBeInTheDocument();
    },
  );

  it("checks the destination after one local login attempt", async () => {
    const { login } = renderLogin(
      userFor("Administrador"),
      "/desconhecida",
      "local",
    );
    const keyboard = userEvent.setup();
    await keyboard.click(
      await screen.findByRole("button", { name: "Entrar com usuário e senha" }),
    );
    await keyboard.type(
      screen.getByLabelText("E-mail:"),
      "fictitious@example.test",
    );
    await keyboard.type(
      screen.getByLabelText("Senha:"),
      "fictitious-test-only-password",
    );
    await keyboard.click(screen.getByRole("button", { name: "Entrar" }));
    expect(
      await screen.findByRole("heading", { name: "/visao-geral" }),
    ).toBeInTheDocument();
    expect(login).toHaveBeenCalledOnce();
  });
});
