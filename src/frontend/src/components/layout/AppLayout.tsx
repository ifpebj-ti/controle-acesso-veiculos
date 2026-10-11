import { type MouseEvent, useEffect, useId, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  profileLabels,
  useAuthenticatedSession,
} from "../../features/authentication";
import { getProfileNavigation } from "../../routes/routeMetadata";
import { Brand } from "../ui/Brand";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

function SidebarContent({ closeMenu }: { closeMenu?: () => void }) {
  const { logout, user } = useAuthenticatedSession();
  const navigate = useNavigate();
  const navigation = getProfileNavigation(user.profileName);
  const navigationId = useId();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(),
  );

  function toggleSection(sectionLabel: string) {
    setCollapsedSections((currentSections) => {
      const nextSections = new Set(currentSections);

      if (nextSections.has(sectionLabel)) {
        nextSections.delete(sectionLabel);
      } else {
        nextSections.add(sectionLabel);
      }

      return nextSections;
    });
  }

  function handleLogout() {
    void logout();
    closeMenu?.();
    navigate("/login");
  }

  return (
    <div className="flex min-h-full flex-col px-4 pb-5 pt-16 xl:pt-6">
      <div className="mb-12 mt-6 px-2 xl:mt-12">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-full border border-success-border bg-success-surface text-primary"
          >
            <Icon name="user" size={30} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-text"
              title={user.email}
            >
              {user.email}
            </p>
            <p className="mt-0.5 text-xs font-medium text-text-muted">
              {profileLabels[user.profileName]}
            </p>
          </div>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="flex-1">
        <ul className="space-y-2">
          {navigation.map((section) => {
            const isExpanded = !collapsedSections.has(section.label);
            const sectionItemsId = `${navigationId}-${section.id}-items`;

            return (
              <li key={section.label}>
                {section.to ? (
                  <NavLink
                    className={({ isActive }) =>
                      `sidebar-primary-item flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 py-3 font-medium ${
                        isActive
                          ? "sidebar-primary-item--active font-semibold"
                          : "text-text hover:bg-surface"
                      }`
                    }
                    onClick={closeMenu}
                    to={section.to}
                  >
                    <Icon name={section.icon} size={20} />
                    <span>{section.label}</span>
                  </NavLink>
                ) : (
                  <>
                    <Button
                      aria-controls={sectionItemsId}
                      aria-expanded={isExpanded}
                      className="sidebar-section w-full"
                      variant="secondary"
                      onClick={() => toggleSection(section.label)}
                      type="button"
                    >
                      <Icon name={section.icon} size={20} />
                      <span className="flex-1 text-left">{section.label}</span>
                      <Icon
                        className={isExpanded ? "rotate-180" : ""}
                        name="chevron-down"
                        size={17}
                      />
                    </Button>

                    {isExpanded && section.items && (
                      <ul
                        className="ml-3 mt-1 space-y-1 border-l border-border pl-3"
                        id={sectionItemsId}
                      >
                        {section.items.map((item) => (
                          <li key={item.to}>
                            <NavLink
                              className={({ isActive }) =>
                                `sidebar-primary-item flex min-h-12 items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-sm ${
                                  isActive
                                    ? "sidebar-primary-item--active font-semibold"
                                    : "text-text hover:bg-surface"
                                }`
                              }
                              onClick={closeMenu}
                              to={item.to}
                            >
                              <Icon name={item.icon} size={17} />
                              <span>{item.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <NavLink
        className={({ isActive }) =>
          `sidebar-primary-item mt-4 flex min-h-12 w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left font-semibold ${
            isActive
              ? "sidebar-primary-item--active"
              : "text-text hover:bg-surface"
          }`
        }
        onClick={closeMenu}
        to="/conta/senha"
      >
        <Icon name="shield" size={21} />
        Alterar senha
      </NavLink>

      <Button
        className="sidebar-logout mt-2 w-full justify-start"
        variant="secondary"
        onClick={handleLogout}
        type="button"
      >
        <Icon name="log-out" size={21} />
        Sair
      </Button>

      <div className="mt-6 border-t border-border pt-6">
        <Brand compact className="mx-auto min-h-24 justify-center" />
      </div>
    </div>
  );
}

function StandardAppLayout() {
  const { sessionNotice } = useAuthenticatedSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuDialogRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

  function skipToPageContent(event: MouseEvent<HTMLAnchorElement>) {
    const pageHeading = document.querySelector<HTMLElement>(
      "#conteudo-principal h1",
    );

    if (!pageHeading) return;

    event.preventDefault();
    pageHeading.tabIndex = -1;
    pageHeading.dataset.routeFocusTarget = "";
    pageHeading.focus();
  }

  useEffect(() => {
    if (!menuOpen) return;

    const previouslyFocusedElement = document.activeElement;
    const menuTrigger = menuTriggerRef.current;
    menuCloseRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements =
        menuDialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      } else {
        menuTrigger?.focus();
      }
    };
  }, [menuOpen]);

  return (
    <div className="min-h-svh bg-background text-text">
      <a
        className="ui-button ui-button--primary fixed left-4 top-3 z-50 -translate-y-24 focus:translate-y-0"
        href="#conteudo-principal"
        onClick={skipToPageContent}
      >
        Ir para o conteúdo
      </a>

      <aside className="sidebar-scroll fixed inset-y-0 left-0 z-30 hidden w-72 overflow-y-auto overflow-x-hidden border-r border-border bg-navigation-surface xl:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 xl:hidden">
        <Button
          aria-expanded={menuOpen}
          aria-label="Abrir menu"
          className="shell-icon-button shrink-0"
          variant="secondary"
          onClick={() => setMenuOpen(true)}
          ref={menuTriggerRef}
          type="button"
        >
          <Icon name="menu" />
        </Button>
        <span className="text-sm font-bold text-ink">Controle de Acesso</span>
        <span aria-hidden="true" className="size-12 shrink-0" />
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            aria-hidden="true"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-overlay"
            onClick={() => setMenuOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <aside
            aria-label="Menu principal"
            aria-modal="true"
            className="sidebar-scroll absolute inset-y-0 left-0 w-[min(90vw,20rem)] overflow-y-auto overflow-x-hidden border-r border-border bg-navigation-surface"
            ref={menuDialogRef}
            role="dialog"
          >
            <Button
              aria-label="Fechar menu"
              className="shell-icon-button absolute right-3 top-2 z-10"
              variant="secondary"
              onClick={() => setMenuOpen(false)}
              ref={menuCloseRef}
              type="button"
            >
              <Icon name="x" />
            </Button>
            <SidebarContent closeMenu={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main
        className="min-h-svh min-w-0 max-w-full bg-background xl:pl-72"
        id="conteudo-principal"
        tabIndex={-1}
      >
        <div className="mx-auto min-w-0 w-full max-w-[94rem] px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          {sessionNotice === "renewal-unavailable" && (
            <div
              aria-atomic="true"
              className="mb-5 rounded-xl border border-warning-border bg-warning-surface px-4 py-3 text-sm font-semibold text-warning-text"
              role="alert"
            >
              Não foi possível renovar a sessão agora. Seus dados foram
              mantidos; verifique a conexão antes de continuar.
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function MandatoryPasswordChangeLayout() {
  const { logout, sessionNotice } = useAuthenticatedSession();
  const navigate = useNavigate();

  function handleLogout() {
    void logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-svh bg-background text-text">
      <header className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <Brand className="min-w-0 max-w-[17rem]" />
          <Button
            className="shrink-0"
            variant="secondary"
            onClick={handleLogout}
            type="button"
          >
            <Icon name="log-out" size={19} />
            Sair
          </Button>
        </div>
      </header>

      <main
        className="mx-auto min-h-[calc(100svh-5rem)] w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10"
        id="conteudo-principal"
        tabIndex={-1}
      >
        {sessionNotice === "renewal-unavailable" && (
          <div
            aria-atomic="true"
            className="mb-5 rounded-xl border border-warning-border bg-warning-surface px-4 py-3 text-sm font-semibold text-warning-text"
            role="alert"
          >
            Não foi possível renovar a sessão agora. Verifique a conexão antes
            de trocar sua senha.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

export function AppLayout() {
  const { user } = useAuthenticatedSession();

  return user.requiresPasswordChange ? (
    <MandatoryPasswordChangeLayout />
  ) : (
    <StandardAppLayout />
  );
}
