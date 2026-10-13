import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { SessionContext } from "../../features/authentication/session/SessionContext";
import type { ProfileName } from "../../features/authentication/types";
import { RouteTransitionManager } from "../../routes/RouteTransitionManager";
import { expectNoSeriousAccessibilityViolations } from "../../test/accessibility";
import { AppLayout } from "./AppLayout";

function renderLayout(
  profileName: ProfileName = "Porteiro",
  sessionNotice: "renewal-unavailable" | null = null,
  requiresPasswordChange = false,
) {
  const logout = vi.fn();
  const view = render(
    <SessionContext.Provider
      value={{
        completePasswordChange: vi.fn(),
        expiresAtUtc: "2026-09-03T23:59:59.000Z",
        login: vi.fn(),
        logout,
        sessionEndReason: null,
        sessionNotice,
        status: "authenticated",
        user: {
          email: "operador@example.test",
          id: 42,
          profileName,
          requiresPasswordChange,
        },
      }}
    >
      <MemoryRouter
        initialEntries={[
          requiresPasswordChange ? "/conta/senha" : "/visao-geral",
        ]}
      >
        <Routes>
          <Route element={<AppLayout />}>
            <Route element={<h1>Visão operacional fictícia</h1>} path="*" />
          </Route>
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>,
  );

  return { ...view, logout };
}

function renderNavigableLayout() {
  return render(
    <SessionContext.Provider
      value={{
        completePasswordChange: vi.fn(),
        expiresAtUtc: "2026-09-03T23:59:59.000Z",
        login: vi.fn(),
        logout: vi.fn(),
        sessionEndReason: null,
        status: "authenticated",
        user: {
          email: "operador@example.test",
          id: 42,
          profileName: "Porteiro",
          requiresPasswordChange: false,
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
  it.each<ProfileName>([
    "Porteiro",
    "Vigilante",
    "SetorTransporte",
    "Administrador",
  ])(
    "preserves both ends of the mobile focus trap and logout for %s",
    async (profile) => {
      const user = userEvent.setup();
      const { logout } = renderLayout(profile);
      const trigger = screen.getByRole("button", { name: "Abrir menu" });
      trigger.focus();
      await user.keyboard("{Enter}");
      const dialog = screen.getByRole("dialog", { name: "Menu principal" });
      const close = within(dialog).getByRole("button", {
        name: "Recolher menu",
      });
      expect(close).toHaveFocus();
      await user.tab({ shift: true });
      const exit = within(dialog).getByRole("button", { name: "Sair" });
      expect(exit).toHaveFocus();
      await user.tab();
      expect(close).toHaveFocus();
      await user.keyboard("{Escape}");
      expect(trigger).toHaveFocus();
      await user.keyboard("{Enter}");
      await user.tab({ shift: true });
      await user.keyboard("{Enter}");
      expect(logout).toHaveBeenCalledOnce();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );

  it.each<ProfileName>([
    "Porteiro",
    "Vigilante",
    "SetorTransporte",
    "Administrador",
  ])("uses the tablet-collapsed navigation shell for %s", (profileName) => {
    renderLayout(profileName);

    expect(screen.getByRole("complementary")).toHaveClass("hidden", "xl:block");
    expect(screen.getByRole("banner")).toHaveClass("xl:hidden");
    expect(screen.getByRole("main")).toHaveClass("xl:pl-72");
  });

  it("keeps the compact system identity above the account without moving the remaining content", () => {
    renderLayout("Porteiro");

    const sidebar = screen.getByRole("complementary");
    const account = within(sidebar).getByText("operador@example.test");
    const navigation = within(sidebar).getByRole("navigation");
    const logout = within(sidebar).getByRole("button", { name: "Sair" });
    const systemIdentity = sidebar.querySelector(".sidebar-system-identity");
    const institutionalBrand = sidebar.querySelector(
      ".sidebar-institutional-brand",
    );

    expect(systemIdentity).toHaveClass("mb-9", "h-12");
    expect(
      within(sidebar).queryByRole("img", {
        name: "Instituto Federal de Pernambuco, Campus Belo Jardim",
      }),
    ).not.toBeInTheDocument();
    expect(systemIdentity).toBeInTheDocument();

    expect(
      (systemIdentity as Element).compareDocumentPosition(account) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      account.compareDocumentPosition(navigation) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      logout.compareDocumentPosition(institutionalBrand as Element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(systemIdentity).not.toHaveTextContent(
      "Sistema de acesso e cadastro veicular",
    );
    expect(systemIdentity?.querySelector("img")).toHaveAttribute(
      "src",
      "/favicon.png",
    );
    expect(systemIdentity?.querySelector("img")).toHaveClass("size-12");
    expect(institutionalBrand?.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/ifpe-horizontal.png",
    );
    expect(institutionalBrand?.querySelector("img")).toHaveClass("h-8");
    expect(within(sidebar).getByText("operador@example.test")).toBeVisible();
    expect(within(sidebar).getByText("Porteiro")).toBeVisible();
  });

  it("keeps long account identifiers compact without breaking the sidebar", () => {
    renderLayout("Porteiro");

    const sidebar = screen.getByRole("complementary");
    const accountIdentifier = within(sidebar).getByText(
      "operador@example.test",
    );
    const profile = within(sidebar).getByText("Porteiro");

    expect(accountIdentifier).toHaveClass("truncate");
    expect(accountIdentifier).not.toHaveClass("break-all");
    expect(profile).toHaveClass("text-text");
  });

  it("announces an unavailable session renewal assertively", () => {
    renderLayout("Porteiro", "renewal-unavailable");

    expect(screen.getByRole("alert")).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível renovar a sessão agora. Seus dados foram mantidos; verifique a conexão antes de continuar.",
    );
  });

  it("hides application navigation and keeps logout available during mandatory password change", async () => {
    const user = userEvent.setup();
    const { container, logout } = renderLayout("Porteiro", null, true);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir menu" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Alterar senha" }),
    ).not.toBeInTheDocument();
    const logoutButton = screen.getByRole("button", { name: "Sair" });
    expect(logoutButton).toBeVisible();
    await user.click(logoutButton);
    expect(logout).toHaveBeenCalledOnce();
    await expectNoSeriousAccessibilityViolations(container);
  });

  it("does not repeat development status inside authenticated pages", () => {
    renderLayout();

    expect(
      screen.queryByText(/homologação institucional e liberação para produção/),
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
      name: "Recolher menu",
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
    expect(
      within(dialog).getByRole("link", { name: "Alterar senha" }),
    ).toHaveAttribute("href", "/conta/senha");
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
      screen.getByRole("link", { name: "Histórico de acessos" }),
    ).toHaveClass("sidebar-primary-item--active");
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
