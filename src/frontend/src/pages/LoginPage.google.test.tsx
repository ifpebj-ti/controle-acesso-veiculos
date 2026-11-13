import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticationService = vi.hoisted(() => ({
  getAuthenticationProviders: vi.fn(),
  startGoogleAuthentication: vi.fn(),
}));

vi.mock(
  "../features/authentication/services/authenticationService",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../features/authentication/services/authenticationService")
    >()),
    ...authenticationService,
  }),
);

import { AppearanceProvider } from "../features/appearance";
import {
  SessionContext,
  type SessionContextValue,
} from "../features/authentication/session/SessionContext";
import type { AuthenticatedUser } from "../features/authentication";
import { LoginPage } from "./LoginPage";

function LocationState() {
  const location = useLocation();
  return <output aria-label="Localização atual">{location.search}</output>;
}

function renderLogin({
  initialEntry = "/login",
  login = vi.fn<SessionContextValue["login"]>(),
  restoreExternalSession = vi.fn<() => Promise<AuthenticatedUser>>(),
}: {
  initialEntry?: string;
  login?: SessionContextValue["login"];
  restoreExternalSession?: () => Promise<AuthenticatedUser>;
} = {}) {
  return render(
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
          status: "unauthenticated",
          user: null,
        }}
      >
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              element={
                <>
                  <LoginPage />
                  <LocationState />
                </>
              }
              path="/login"
            />
            <Route element={<h1>Visão geral</h1>} path="/visao-geral" />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </AppearanceProvider>,
  );
}

beforeEach(() => {
  authenticationService.getAuthenticationProviders.mockReset();
  authenticationService.startGoogleAuthentication.mockReset();
});

describe("LoginPage Google and administrative access", () => {
  it("switches exclusive views, clears credentials and restores keyboard focus", async () => {
    authenticationService.getAuthenticationProviders.mockResolvedValue({
      googleEnabled: true,
    });
    const user = userEvent.setup();
    renderLogin();

    await screen.findByRole("button", { name: "Continuar com Google" });
    const administrativeAccess = screen.getByRole("button", {
      name: "Entrar com usuário e senha",
    });
    administrativeAccess.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("heading", { name: "Acesso administrativo" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continuar com Google" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Entrar com usuário e senha" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("E-mail:")).toHaveFocus();
    await user.type(screen.getByLabelText("E-mail:"), "admin@example.test");
    await user.type(
      screen.getByLabelText("Senha:"),
      "Fictitious-test-only-461!",
    );
    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.queryByLabelText("Senha:")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Entrar com usuário e senha" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Continuar com Google" }),
    ).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("E-mail:")).toHaveFocus();
    expect(screen.getByLabelText("Senha:")).toHaveValue("");
  });

  it("submits once while pending and keeps the administrative view on failure", async () => {
    authenticationService.getAuthenticationProviders.mockResolvedValue({
      googleEnabled: true,
    });
    let rejectLogin!: (reason: unknown) => void;
    const login = vi.fn<SessionContextValue["login"]>().mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectLogin = reject;
        }),
    );
    const user = userEvent.setup();
    renderLogin({ login });
    await user.click(
      await screen.findByRole("button", { name: "Entrar com usuário e senha" }),
    );
    await user.type(screen.getByLabelText("E-mail:"), "admin@example.test");
    await user.type(
      screen.getByLabelText("Senha:"),
      "Fictitious-test-only-461!",
    );
    await user.dblClick(screen.getByRole("button", { name: "Entrar" }));

    expect(login).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Entrando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeDisabled();
    rejectLogin(new Error("network unavailable"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail:")).toHaveValue("admin@example.test");
    expect(
      screen.queryByRole("button", { name: "Continuar com Google" }),
    ).not.toBeInTheDocument();
    expect(login).toHaveBeenCalledOnce();
  });

  it("announces a failure to start Google and permits an explicit retry", async () => {
    authenticationService.getAuthenticationProviders.mockResolvedValue({
      googleEnabled: true,
    });
    authenticationService.startGoogleAuthentication.mockImplementationOnce(
      () => {
        throw new Error("navigation unavailable");
      },
    );
    const user = userEvent.setup();
    renderLogin();
    await user.click(
      await screen.findByRole("button", { name: "Continuar com Google" }),
    );
    const alert = await screen.findByRole("alert");
    await waitFor(() => expect(alert).toHaveFocus());
    expect(alert).toHaveTextContent("Não foi possível iniciar o acesso agora.");
    await user.click(
      screen.getByRole("button", { name: "Continuar com Google" }),
    );
    expect(
      authenticationService.startGoogleAuthentication,
    ).toHaveBeenCalledTimes(2);
  });

  it("shows Google as the primary action only when the API enables it", async () => {
    authenticationService.getAuthenticationProviders.mockResolvedValue({
      googleEnabled: true,
    });
    const user = userEvent.setup();
    renderLogin();

    const google = await screen.findByRole("button", {
      name: "Continuar com Google",
    });
    await waitFor(() => expect(google).toHaveFocus());
    expect(google.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/google-g.png",
    );
    expect(google.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.queryByLabelText("E-mail:")).not.toBeInTheDocument();

    await user.click(google);

    expect(
      authenticationService.startGoogleAuthentication,
    ).toHaveBeenCalledOnce();
  });

  it("keeps Google visible but unavailable when the API disables the provider", async () => {
    authenticationService.getAuthenticationProviders.mockResolvedValue({
      googleEnabled: false,
    });
    const user = userEvent.setup();
    renderLogin();

    expect(
      await screen.findByText(
        "O acesso com Google não está disponível neste ambiente.",
      ),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Entrar com usuário e senha" }),
      ).toHaveFocus(),
    );
    const google = screen.getByRole("button", { name: "Continuar com Google" });
    expect(google).toBeDisabled();
    expect(google.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/google-g.png",
    );
    expect(google).toHaveAccessibleDescription(
      "O acesso com Google não está disponível neste ambiente.",
    );
    await user.click(google);
    expect(
      authenticationService.startGoogleAuthentication,
    ).not.toHaveBeenCalled();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Entrar com usuário e senha" }),
    ).toHaveFocus();
    expect(screen.queryByLabelText("E-mail:")).not.toBeInTheDocument();
  });

  it("keeps administrative access closed when provider discovery fails", async () => {
    authenticationService.getAuthenticationProviders.mockRejectedValue(
      new Error("unavailable"),
    );
    const user = userEvent.setup();
    renderLogin();

    expect(
      await screen.findByRole("alert", {
        name: "",
      }),
    ).toHaveTextContent("Não foi possível verificar as opções de acesso.");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Tentar novamente" }),
      ).toHaveFocus(),
    );
    expect(screen.queryByLabelText("E-mail:")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Entrar com usuário e senha" }),
    );

    expect(screen.getByLabelText("E-mail:")).toHaveFocus();
    expect(
      screen.getByText(
        "Entre com e-mail e senha. Exclusivo para contas do perfil Administrador.",
      ),
    ).toBeInTheDocument();
  });

  it("consumes a denied return without attempting session restoration", async () => {
    authenticationService.getAuthenticationProviders.mockResolvedValue({
      googleEnabled: true,
    });
    const restoreExternalSession = vi.fn();
    renderLogin({
      initialEntry: "/login?status=denied",
      restoreExternalSession,
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível concluir o acesso.");
    await waitFor(() => expect(alert).toHaveFocus());
    expect(restoreExternalSession).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Localização atual")).toHaveTextContent("");
  });

  it("restores the local session after a successful Google return", async () => {
    authenticationService.getAuthenticationProviders.mockResolvedValue({
      googleEnabled: true,
    });
    const authenticatedUser: AuthenticatedUser = {
      email: "operator@example.test",
      id: 42,
      profileName: "Porteiro",
      requiresPasswordChange: false,
    };
    const restoreExternalSession = vi.fn().mockResolvedValue(authenticatedUser);
    renderLogin({
      initialEntry: "/login?status=success",
      restoreExternalSession,
    });

    expect(
      await screen.findByRole("heading", { name: "Visão geral" }),
    ).toBeInTheDocument();
    expect(restoreExternalSession).toHaveBeenCalledOnce();
  });

  it("rejects success without a valid renewable session and removes status", async () => {
    authenticationService.getAuthenticationProviders.mockResolvedValue({
      googleEnabled: true,
    });
    const restoreExternalSession = vi
      .fn()
      .mockRejectedValue(new Error("no session"));
    renderLogin({
      initialEntry: "/login?status=success",
      restoreExternalSession,
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Não foi possível confirmar uma sessão válida.",
    );
    expect(screen.getByLabelText("Localização atual")).toHaveTextContent("");
    expect(restoreExternalSession).toHaveBeenCalledOnce();
  });
});
