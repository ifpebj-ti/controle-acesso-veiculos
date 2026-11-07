import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SessionContext,
  type SessionContextValue,
} from "../authentication/session/SessionContext";
import { useSession } from "../authentication";
import { mockFullscreen } from "../../test/fullscreen";
import { FullscreenControl } from "./FullscreenControl";
import { FullscreenInvitation } from "./FullscreenInvitation";
import { FullscreenInvitationProvider } from "./FullscreenInvitationProvider";
import { useFullscreen } from "./useFullscreen";
import { fullscreenInvitationKey } from "./invitationSession";
import { AppLayout } from "../../components/layout/AppLayout";
import { AppearanceProvider } from "../appearance";

const inviteName = "Quer usar o sistema em tela cheia?";
const guide =
  "Você pode ativar a tela cheia a qualquer momento pelo menu lateral, abaixo de Aparência.";

function Probe({
  initialDialog = false,
  blocked = false,
}: {
  initialDialog?: boolean;
  blocked?: boolean;
}) {
  const { status, user } = useSession();
  const fullscreen = useFullscreen();
  const [dialog, setDialog] = useState(initialDialog);
  if (status !== "authenticated" || !user) return <h1>Login fictício</h1>;
  return (
    <>
      <FullscreenInvitation fullscreen={fullscreen} blocked={blocked} />
      <h1 tabIndex={-1}>Página fictícia</h1>
      <label>
        Rascunho fictício
        <input />
      </label>
      <Link to="/acessos/novo">Registrar</Link>
      <Link to="/visao-geral">Visão geral</Link>
      <button onClick={() => setDialog(true)}>Abrir diálogo</button>
      {dialog && (
        <div role="dialog" aria-label="Diálogo fictício">
          <button onClick={() => setDialog(false)}>Fechar diálogo</button>
        </div>
      )}
      <aside aria-label="Ajustes">
        <FullscreenControl fullscreen={fullscreen} />
      </aside>
    </>
  );
}

const session: SessionContextValue = {
  status: "authenticated",
  user: {
    id: 42,
    email: "operador@example.test",
    profileName: "Porteiro",
    requiresPasswordChange: false,
  },
  login: vi.fn(),
  logout: vi.fn(),
  completePasswordChange: vi.fn(),
  expiresAtUtc: null,
  sessionEndReason: null,
};
function tree(value = session, path = "/visao-geral", props = {}) {
  return (
    <SessionContext.Provider value={value}>
      <FullscreenInvitationProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="*" element={<Probe {...props} />} />
          </Routes>
        </MemoryRouter>
      </FullscreenInvitationProvider>
    </SessionContext.Provider>
  );
}

describe("optional fullscreen invitation (simulated native API)", () => {
  let mock: ReturnType<typeof mockFullscreen>;
  beforeEach(() => {
    sessionStorage.clear();
    mock = mockFullscreen();
  });
  afterEach(() => {
    cleanup();
    mock.restore();
    vi.useRealTimers();
  });

  it("offers on overview without requesting fullscreen or stealing focus", () => {
    render(tree());
    expect(
      screen.getByRole("region", { name: inviteName }),
    ).toBeInTheDocument();
    expect(mock.request).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
  });

  it("dismisses by keyboard, announces guidance and focuses a stable page heading", async () => {
    render(tree());
    const user = userEvent.setup();
    const dismiss = screen.getByRole("button", { name: "Agora não" });
    dismiss.focus();
    await user.keyboard("{Enter}");
    const hint = screen.getByText(guide);
    expect(
      screen.getByRole("heading", { name: "Página fictícia" }),
    ).toHaveFocus();
    expect(hint).toHaveAttribute("role", "status");
    expect(hint).toHaveAttribute("aria-live", "polite");
    expect(
      screen.queryByRole("button", { name: "Agora não" }),
    ).not.toBeInTheDocument();
    expect(mock.request).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    ).toBeInTheDocument();
  });

  it("requires an explicit click, shares the existing controller and preserves a draft on native exit", async () => {
    render(tree());
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Rascunho fictício"), "Preservar");
    // Editing an already presented invitation never removes the form or its data.
    const control = within(
      screen.getByRole("complementary", { name: "Ajustes" }),
    );
    await user.click(
      control.getByRole("button", { name: "Entrar em tela cheia" }),
    );
    expect(mock.request).toHaveBeenCalledOnce();
    act(() => mock.change(null));
    expect(screen.getByLabelText("Rascunho fictício")).toHaveValue("Preservar");
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
    expect(
      control.getByRole("button", { name: "Entrar em tela cheia" }),
    ).toBeInTheDocument();
  });

  it("accepts the invitation once and returns focus to the stable page heading", async () => {
    render(tree());
    const user = userEvent.setup();
    await user.click(
      within(screen.getByRole("region", { name: inviteName })).getByRole(
        "button",
        { name: "Entrar em tela cheia" },
      ),
    );
    expect(mock.request).toHaveBeenCalledOnce();
    expect(document.fullscreenElement).toBe(document.documentElement);
    expect(await screen.findByText(guide)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Página fictícia" }),
    ).toHaveFocus();
    act(() => mock.change(null));
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
  });

  it("keeps rejection understandable and retries only explicitly", async () => {
    mock.request.mockRejectedValueOnce(new Error("fictitious refusal"));
    render(tree());
    const user = userEvent.setup();
    const region = screen.getByRole("region", { name: inviteName });
    await user.click(
      within(region).getByRole("button", { name: "Entrar em tela cheia" }),
    );
    expect(within(region).getByRole("status")).toHaveTextContent(
      "Não foi possível abrir a tela cheia",
    );
    expect(within(region).getByRole("status")).toHaveFocus();
    expect(mock.request).toHaveBeenCalledOnce();
    await user.click(
      within(region).getByRole("button", { name: "Entrar em tela cheia" }),
    );
    expect(mock.request).toHaveBeenCalledTimes(2);
  });

  it("prevents concurrent actions while the native request is pending", async () => {
    let resolve!: () => void;
    mock.request.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    render(tree());
    const user = userEvent.setup();
    const region = screen.getByRole("region", { name: inviteName });
    const enter = within(region).getByRole("button", {
      name: "Entrar em tela cheia",
    });
    await user.dblClick(enter);
    await user.click(within(region).getByRole("button", { name: "Agora não" }));
    expect(mock.request).toHaveBeenCalledOnce();
    expect(enter).toHaveAttribute("aria-disabled", "true");
    await act(async () => {
      mock.change(document.documentElement);
      resolve();
    });
    expect(await screen.findByText(guide)).toBeInTheDocument();
  });

  it("does not reoffer after route navigation or a reload", async () => {
    const view = render(tree());
    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Registrar" }));
    await user.click(screen.getByRole("link", { name: "Visão geral" }));
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
    view.unmount();
    render(tree());
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
  });

  it("does not invite while restoring or unauthenticated; logout clears dismissal", async () => {
    const view = render(tree({ ...session, status: "restoring", user: null }));
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
    view.rerender(tree());
    await userEvent.click(screen.getByRole("button", { name: "Agora não" }));
    view.rerender(tree({ ...session, status: "unauthenticated", user: null }));
    expect(sessionStorage.getItem(fullscreenInvitationKey)).toBeNull();
    view.rerender(tree());
    expect(
      screen.getByRole("region", { name: inviteName }),
    ).toBeInTheDocument();
  });

  it("does not transfer a dismissal to another account", async () => {
    const view = render(tree());
    await userEvent.click(screen.getByRole("button", { name: "Agora não" }));
    view.rerender(tree({ ...session, user: { ...session.user!, id: 43 } }));
    expect(
      screen.getByRole("region", { name: inviteName }),
    ).toBeInTheDocument();
  });

  it("does not offer in an operational form, with a blocked layout or without support", () => {
    const view = render(tree(session, "/acessos/novo"));
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
    view.rerender(tree(session, "/acessos/novo", { blocked: true }));
    expect(mock.request).not.toHaveBeenCalled();
    view.unmount();
    mock.disable();
    render(tree());
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
  });

  it("defers until an existing dialog is closed, without stealing its focus", async () => {
    render(tree(session, "/visao-geral", { initialDialog: true }));
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Fechar diálogo" }),
    );
    expect(
      await screen.findByRole("region", { name: inviteName }),
    ).toBeInTheDocument();
    expect(mock.request).not.toHaveBeenCalled();
  });

  it("does not offer when already fullscreen, including after a native exit", () => {
    mock.change(document.documentElement);
    render(tree());
    act(() => mock.change(null));
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
    expect(mock.request).not.toHaveBeenCalled();
  });

  it("defers to session notices and a collapsed mobile menu without opening it", () => {
    const view = render(tree(session, "/visao-geral", { blocked: true }));
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
    expect(mock.request).not.toHaveBeenCalled();
    view.rerender(tree());
    expect(
      screen.getByRole("region", { name: inviteName }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not interrupt editing that started before presentation", () => {
    const input = document.createElement("input");
    document.body.append(input);
    input.focus();
    try {
      render(tree());
      expect(
        screen.queryByRole("region", { name: inviteName }),
      ).not.toBeInTheDocument();
      expect(input).toHaveFocus();
      expect(mock.request).not.toHaveBeenCalled();
    } finally {
      input.remove();
    }
  });

  it("preserves the real mandatory-password layout without inviting", () => {
    render(
      <AppearanceProvider>
        <SessionContext.Provider
          value={{
            ...session,
            user: { ...session.user!, requiresPasswordChange: true },
          }}
        >
          <FullscreenInvitationProvider>
            <MemoryRouter initialEntries={["/conta/senha"]}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route
                    path="/conta/senha"
                    element={<h1>Troca fictícia de senha</h1>}
                  />
                </Route>
              </Routes>
            </MemoryRouter>
          </FullscreenInvitationProvider>
        </SessionContext.Provider>
      </AppearanceProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Troca fictícia de senha" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: inviteName }),
    ).not.toBeInTheDocument();
    expect(sessionStorage.getItem(fullscreenInvitationKey)).toBeNull();
    expect(mock.request).not.toHaveBeenCalled();
  });

  it("removes only the optional guidance after twelve seconds without losing focus", () => {
    vi.useFakeTimers();
    render(tree());
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    const heading = screen.getByRole("heading", { name: "Página fictícia" });
    expect(heading).toHaveFocus();
    act(() => vi.advanceTimersByTime(11_999));
    expect(screen.getByText(guide)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText(guide)).not.toBeInTheDocument();
    expect(heading).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem(fullscreenInvitationKey)).toBe("handled");
    expect(mock.request).not.toHaveBeenCalled();
  });

  it("gives a fresh reading interval after the pointer leaves the guidance", () => {
    vi.useFakeTimers();
    render(tree());
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    const region = screen.getByRole("region", {
      name: "Tela cheia pelo menu lateral",
    });
    fireEvent.mouseEnter(region);
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByText(guide)).toBeInTheDocument();
    fireEvent.mouseLeave(region);
    act(() => vi.advanceTimersByTime(12_000));
    expect(screen.queryByText(guide)).not.toBeInTheDocument();
  });

  it("never removes the guidance while keyboard focus is inside it", () => {
    vi.useFakeTimers();
    render(tree());
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    act(() => screen.getByText(guide).focus());
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByText(guide)).toHaveFocus();
    act(() => screen.getByRole("heading", { name: "Página fictícia" }).focus());
    act(() => vi.advanceTimersByTime(12_000));
    expect(screen.queryByText(guide)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Página fictícia" }),
    ).toHaveFocus();
  });

  it("does not count background time as a chance to read the guidance", () => {
    vi.useFakeTimers();
    render(tree());
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    const visibility = vi.spyOn(document, "visibilityState", "get");
    try {
      visibility.mockReturnValue("hidden");
      fireEvent(document, new Event("visibilitychange"));
      act(() => vi.advanceTimersByTime(30_000));
      expect(screen.getByText(guide)).toBeInTheDocument();
      visibility.mockReturnValue("visible");
      fireEvent(document, new Event("visibilitychange"));
      act(() => vi.advanceTimersByTime(12_000));
      expect(screen.queryByText(guide)).not.toBeInTheDocument();
    } finally {
      visibility.mockRestore();
    }
  });

  it("does not apply the guidance timeout to the invitation itself", () => {
    vi.useFakeTimers();
    render(tree());
    act(() => vi.advanceTimersByTime(60_000));
    expect(
      screen.getByRole("region", { name: inviteName }),
    ).toBeInTheDocument();
    expect(mock.request).not.toHaveBeenCalled();
  });
});
