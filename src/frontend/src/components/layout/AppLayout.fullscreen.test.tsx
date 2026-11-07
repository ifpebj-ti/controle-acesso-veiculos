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
import { createPortal } from "react-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppearanceProvider } from "../../features/appearance";
import { SessionContext } from "../../features/authentication/session/SessionContext";
import { mockFullscreen } from "../../test/fullscreen";
import { AppLayout } from "./AppLayout";

function FormProbe() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h1>Formulário fictício</h1>
      <label>
        Objetivo fictício
        <input />
      </label>
      <button onClick={() => setOpen(true)}>Abrir portal fictício</button>
      {open &&
        createPortal(
          <section role="dialog" aria-label="Portal fictício">
            <p>Conteúdo preservado</p>
            <button onClick={() => setOpen(false)}>
              Fechar portal fictício
            </button>
          </section>,
          document.body,
        )}
    </>
  );
}
function mount(requiresPasswordChange = false) {
  return render(
    <AppearanceProvider>
      <SessionContext.Provider
        value={{
          completePasswordChange: vi.fn(),
          expiresAtUtc: "2099-01-01T00:00:00Z",
          login: vi.fn(),
          logout: vi.fn(),
          restoreExternalSession: vi.fn(),
          sessionEndReason: null,
          status: "authenticated",
          user: {
            email: "operador@example.test",
            id: 42,
            profileName: "Porteiro",
            requiresPasswordChange,
          },
        }}
      >
        <MemoryRouter initialEntries={["/visao-geral"]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/visao-geral" element={<FormProbe />} />
              <Route
                path="/acessos/historico"
                element={<h1>Histórico fictício</h1>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </AppearanceProvider>,
  );
}
describe("authenticated layout fullscreen scope (mocked API)", () => {
  let mock: ReturnType<typeof mockFullscreen>;
  beforeEach(() => {
    mock = mockFullscreen();
  });
  afterEach(() => {
    cleanup();
    mock.restore();
  });
  it("keeps menu, form and body portal within the chosen document root", async () => {
    const user = userEvent.setup();
    mount();
    await user.type(
      screen.getByLabelText("Objetivo fictício"),
      "Texto não enviado",
    );
    await user.click(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Abrir portal fictício" }),
    );
    const portal = screen.getByRole("dialog", { name: "Portal fictício" });
    expect(portal.parentElement).toBe(document.body);
    expect(document.fullscreenElement).toBe(document.documentElement);
    expect(document.fullscreenElement).toContainElement(portal);
    expect(document.fullscreenElement).toContainElement(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    );
    act(() => mock.change(null));
    expect(portal).toBeInTheDocument();
    expect(screen.getByLabelText("Objetivo fictício")).toHaveValue(
      "Texto não enviado",
    );
  });
  it("keeps one controller across opening/closing the mobile menu and navigation", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const menu = screen.getByRole("dialog", { name: "Menu principal" });
    await user.click(
      within(menu).getByRole("button", { name: "Entrar em tela cheia" }),
    );
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(window, event);
    expect(event.defaultPrevented).toBe(false);
    expect(
      screen.queryByRole("dialog", { name: "Menu principal" }),
    ).not.toBeInTheDocument();
    expect(mock.exit).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Sair da tela cheia" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("link", { name: "Histórico de acessos" }),
    );
    expect(
      screen.getByRole("heading", { name: "Histórico fictício" }),
    ).toBeInTheDocument();
    expect(mock.request).toHaveBeenCalledOnce();
    expect(mock.exit).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Sair da tela cheia" }),
    ).toBeInTheDocument();
  });
  it("also offers the optional control in the mandatory-password layout", async () => {
    const user = userEvent.setup();
    mount(true);
    expect(mock.request).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    );
    expect(
      await screen.findByRole("button", { name: "Sair da tela cheia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Formulário fictício" }),
    ).toBeInTheDocument();
  });
});
