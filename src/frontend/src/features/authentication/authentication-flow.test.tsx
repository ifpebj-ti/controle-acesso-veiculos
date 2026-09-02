import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginPage } from "../../pages/LoginPage";
import { ProfileRoute } from "../../routes/ProfileRoute";
import { ProtectedRoute } from "../../routes/ProtectedRoute";
import {
  api,
  setApiAccessToken,
  setApiUnauthorizedHandler,
} from "../../services/api";
import { SessionProvider } from "./session/SessionProvider";
import { useAuthenticatedSession } from "./session/useSession";
import type { AuthenticatedSession, ProfileName } from "./types";

function sessionFor(
  profileName: ProfileName,
  expiresInMilliseconds = 60_000,
): AuthenticatedSession {
  return {
    accessToken: "test-only-access-token",
    expiresAtUtc: new Date(Date.now() + expiresInMilliseconds).toISOString(),
    user: {
      email: "operator@example.test",
      id: 42,
      profileName,
    },
  };
}

function SessionIdentity() {
  const { logout, user } = useAuthenticatedSession();
  return (
    <div>
      <p>
        {user.email} — {user.profileName}
      </p>
      <button onClick={logout} type="button">
        Sair
      </button>
    </div>
  );
}

function AppFrame() {
  return <Outlet />;
}

function renderAuthenticationFlow(
  initialEntry: string | { pathname: string; state?: unknown } = "/login",
) {
  return render(
    <SessionProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppFrame />}>
              <Route element={<SessionIdentity />} path="/visao-geral" />
              <Route
                element={<ProfileRoute allowedProfiles={["Administrador"]} />}
              >
                <Route element={<p>Administração</p>} path="/administracao" />
              </Route>
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

async function submitCredentials() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("E-mail:"), "operator@example.test");
  await user.type(screen.getByLabelText("Senha:"), "test-only-password");
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

afterEach(() => {
  setApiAccessToken(null);
  setApiUnauthorizedHandler(null);
});

describe("authentication flow", () => {
  it("uses the identity and profile returned by the API", async () => {
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValue({ data: sessionFor("Porteiro") });

    renderAuthenticationFlow();
    await submitCredentials();

    expect(
      await screen.findByText("operator@example.test — Porteiro"),
    ).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/auth/login", {
      email: "operator@example.test",
      password: "test-only-password",
    });
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  it("keeps invalid, inactive and temporarily blocked accounts indistinguishable", async () => {
    vi.spyOn(api, "post").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Credenciais inválidas." }, status: 401 },
    });

    renderAuthenticationFlow();
    await submitCredentials();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha inválidos, ou a conta está temporariamente indisponível.",
    );
  });

  it("presents backend unavailability without confirming a login", async () => {
    vi.spyOn(api, "post").mockRejectedValue(new Error("connection failed"));

    renderAuthenticationFlow();
    await submitCredentials();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar ao sistema. Verifique a rede e tente novamente.",
    );
    expect(
      screen.queryByText(/operator@example.test —/),
    ).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to the login page", () => {
    renderAuthenticationFlow("/visao-geral");

    expect(
      screen.getByRole("heading", { name: "Bem-vindo," }),
    ).toBeInTheDocument();
  });

  it("shows an explicit access denied state for an incompatible profile", async () => {
    vi.spyOn(api, "post").mockResolvedValue({
      data: sessionFor("SetorTransporte"),
    });

    renderAuthenticationFlow({
      pathname: "/login",
      state: { from: { pathname: "/administracao" } },
    });
    await submitCredentials();

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Administração")).not.toBeInTheDocument();
  });

  it("clears the local session on logout", async () => {
    vi.spyOn(api, "post").mockResolvedValue({
      data: sessionFor("Administrador"),
    });

    renderAuthenticationFlow();
    await submitCredentials();
    await screen.findByText("operator@example.test — Administrador");
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(
      await screen.findByRole("heading", { name: "Bem-vindo," }),
    ).toBeInTheDocument();
  });

  it("ends the in-memory session when the token reaches its expiration", async () => {
    vi.spyOn(api, "post").mockResolvedValue({
      data: sessionFor("Vigilante", 60),
    });

    renderAuthenticationFlow();
    fireEvent.change(screen.getByLabelText("E-mail:"), {
      target: { value: "operator@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Senha:"), {
      target: { value: "test-only-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("operator@example.test — Vigilante"),
    ).toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    });

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Sua sessão expirou. Entre novamente para continuar.",
      ),
    );
  });

  it("notifies the session when an authenticated request returns 401", async () => {
    const unauthorizedHandler = vi.fn();
    setApiAccessToken("test-only-access-token");
    setApiUnauthorizedHandler(unauthorizedHandler);

    await expect(
      api.get("/protected", {
        adapter: async (config) =>
          Promise.reject({
            config,
            isAxiosError: true,
            response: { config, data: null, headers: {}, status: 401 },
          }),
      }),
    ).rejects.toMatchObject({ isAxiosError: true });

    expect(unauthorizedHandler).toHaveBeenCalledOnce();
  });
});
