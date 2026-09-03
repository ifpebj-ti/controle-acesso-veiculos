import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { SessionContext } from "../../features/authentication/session/SessionContext";
import type { ProfileName } from "../../features/authentication/types";
import { expectNoSeriousAccessibilityViolations } from "../../test/accessibility";
import { AppLayout } from "./AppLayout";

function renderLayout(profileName: ProfileName = "Porteiro") {
  const view = render(
    <SessionContext.Provider
      value={{
        expiresAtUtc: "2026-09-03T23:59:59.000Z",
        login: vi.fn(),
        logout: vi.fn(),
        sessionEndReason: null,
        status: "authenticated",
        user: {
          email: "operador@example.test",
          id: 42,
          profileName,
        },
      }}
    >
      <MemoryRouter initialEntries={["/visao-geral"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              element={<h1>Visão operacional fictícia</h1>}
              path="/visao-geral"
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>,
  );

  return view;
}

describe("AppLayout", () => {
  it("opens the mobile menu, contains keyboard focus and restores the trigger", async () => {
    const user = userEvent.setup();
    renderLayout();
    const trigger = screen.getByRole("button", { name: "Abrir menu" });

    trigger.focus();
    await user.keyboard("{Enter}");

    const dialog = screen.getByRole("dialog", { name: "Menu principal" });
    const closeButton = within(dialog).getByRole("button", {
      name: "Fechar menu",
    });
    await waitFor(() => expect(closeButton).toHaveFocus());

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(within(dialog).getByRole("button", { name: "Sair" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Menu principal" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps expanded navigation visible and filters actions by profile", async () => {
    const user = userEvent.setup();
    renderLayout("SetorTransporte");

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = screen.getByRole("dialog", { name: "Menu principal" });

    expect(
      within(dialog).getByRole("link", { name: "Histórico" }),
    ).toBeVisible();
    expect(
      within(dialog).queryByRole("link", { name: "Registrar entrada" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("link", { name: "Acessos em aberto" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("link", { name: "Usuários e permissões" }),
    ).not.toBeInTheDocument();
  });

  it("has no serious automated accessibility violations", async () => {
    const { container } = renderLayout("Administrador");

    await expectNoSeriousAccessibilityViolations(container);
  });
});
