import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { SessionContext } from "../../features/authentication/session/SessionContext";
import type { ProfileName } from "../../features/authentication/types";
import { RouteTransitionManager } from "../../routes/RouteTransitionManager";
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

function renderNavigableLayout() {
  return render(
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
          profileName: "Porteiro",
        },
      }}
    >
      <MemoryRouter initialEntries={["/visao-geral"]}>
        <Routes>
          <Route element={<RouteTransitionManager />}>
            <Route element={<AppLayout />}>
              <Route
                element={<h1>Visão operacional fictícia</h1>}
                path="/visao-geral"
              />
              <Route
                element={<h1>Histórico fictício</h1>}
                path="/acessos/historico"
              />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>,
  );
}

describe("AppLayout", () => {
  it("distinguishes the integrated MVP from pending institutional approval", () => {
    renderLayout();

    expect(
      screen.getByText(
        "MVP integrado à API — homologação institucional e liberação para produção permanecem pendentes.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/auditoria e homologação institucional permanecem/),
    ).not.toBeInTheDocument();
  });

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
      within(dialog).getByRole("button", { name: "Supervisão" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      within(dialog).getByRole("button", { name: "Gestão" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      within(dialog).getByRole("link", { name: "Histórico de acessos" }),
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

  it("announces collapsible groups and preserves a clear active item", async () => {
    const user = userEvent.setup();
    renderLayout("Porteiro");

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = screen.getByRole("dialog", { name: "Menu principal" });
    const operations = within(dialog).getByRole("button", {
      name: "Operações",
    });
    const controlledId = operations.getAttribute("aria-controls");

    expect(operations).toHaveAttribute("aria-expanded", "true");
    expect(controlledId).toBeTruthy();
    expect(document.getElementById(controlledId!)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Visão geral" }),
    ).toHaveAttribute("aria-current", "page");

    operations.focus();
    await user.keyboard("{Enter}");
    expect(operations).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(controlledId!)).not.toBeInTheDocument();
    expect(operations).toHaveFocus();

    await user.keyboard(" ");
    expect(operations).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(controlledId!)).toBeInTheDocument();
  });

  it("keeps exceptional general operations out of Administrator navigation", async () => {
    const user = userEvent.setup();
    renderLayout("Administrador");

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = screen.getByRole("dialog", { name: "Menu principal" });

    expect(
      within(dialog).getByRole("button", { name: "Supervisão" }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: "Consultas de apoio" }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: "Gestão técnica" }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("link", { name: "Usuários e permissões" }),
    ).toBeVisible();
    expect(
      within(dialog).queryByRole("link", { name: "Registrar entrada" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("link", { name: "Acessos em aberto" }),
    ).not.toBeInTheDocument();
  });

  it("preserves the skip link and moves focus after mobile menu navigation", async () => {
    const user = userEvent.setup();
    renderNavigableLayout();
    const initialHeading = screen.getByRole("heading", {
      name: "Visão operacional fictícia",
    });

    await waitFor(() => expect(initialHeading).toHaveFocus());
    const skipLink = screen.getByRole("link", {
      name: "Ir para o conteúdo",
    });
    expect(skipLink).toHaveAttribute("href", "#conteudo-principal");
    expect(document.querySelector("#conteudo-principal")).toHaveAttribute(
      "tabindex",
      "-1",
    );

    await user.click(skipLink);
    expect(initialHeading).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = screen.getByRole("dialog", { name: "Menu principal" });
    await user.click(
      within(dialog).getByRole("link", { name: "Histórico de acessos" }),
    );

    const destinationHeading = screen.getByRole("heading", {
      name: "Histórico fictício",
    });
    await waitFor(() => expect(destinationHeading).toHaveFocus());
    expect(
      screen.queryByRole("dialog", { name: "Menu principal" }),
    ).not.toBeInTheDocument();
    expect(document.title).toBe(
      "Histórico de acessos | Controle de Acesso de Veículos",
    );
  });

  it("has no serious automated accessibility violations", async () => {
    const { container } = renderLayout("Administrador");

    await expectNoSeriousAccessibilityViolations(container);
  });
});
