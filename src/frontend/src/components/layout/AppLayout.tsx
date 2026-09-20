import { type MouseEvent, useEffect, useId, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  profileLabels,
  useAuthenticatedSession,
} from "../../features/authentication";
import { getProfileNavigation } from "../../routes/routeMetadata";
import { Brand } from "../ui/Brand";
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
    <div className="flex min-h-full flex-col px-5 pb-5 pt-6">
      <Brand compact className="mx-auto min-h-24" />

      <div className="mt-14 flex items-center gap-3 px-3">
        <span
          aria-hidden="true"
          className="grid size-13 shrink-0 place-items-center rounded-full bg-[#d9d9d9] text-ink"
        >
          <Icon name="user" size={25} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink" title={user.email}>
            {user.email}
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-brand-dark">
            {profileLabels[user.profileName]}
          </p>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="mt-20 flex-1">
        <ul className="space-y-2">
          {navigation.map((section) => {
            const isExpanded = !collapsedSections.has(section.label);
            const sectionItemsId = `${navigationId}-${section.id}-items`;

            return (
              <li key={section.label}>
                {section.to ? (
                  <NavLink
                    className={({ isActive }) =>
                      `sidebar-primary-item flex min-h-12 items-center gap-3 rounded-l-2xl px-4 py-3 font-medium transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-ink ${
                        isActive
                          ? "sidebar-primary-item--active bg-cream text-ink"
                          : "text-ink hover:bg-white/45 hover:text-ink"
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
                    <button
                      aria-controls={sectionItemsId}
                      aria-expanded={isExpanded}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-ink transition-colors hover:text-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink"
                      onClick={() => toggleSection(section.label)}
                      type="button"
                    >
                      <Icon name={section.icon} size={20} />
                      <span className="flex-1">{section.label}</span>
                      <Icon
                        className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        name="chevron-down"
                        size={17}
                      />
                    </button>

                    {isExpanded && section.items && (
                      <ul
                        className="ml-6 mt-1 space-y-1 border-l border-ink/15 pl-3"
                        id={sectionItemsId}
                      >
                        {section.items.map((item) => (
                          <li key={item.to}>
                            <NavLink
                              className={({ isActive }) =>
                                `sidebar-primary-item flex min-h-10 items-center gap-2.5 rounded-l-2xl px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-ink ${
                                  isActive
                                    ? "sidebar-primary-item--active bg-cream font-semibold text-ink"
                                    : "text-ink hover:bg-white/45 hover:text-ink"
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

      <button
        className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-semibold text-ink transition-colors hover:bg-white/45 focus:outline-none focus-visible:ring-3 focus-visible:ring-ink"
        onClick={handleLogout}
        type="button"
      >
        <Icon name="log-out" size={21} />
        Sair
      </button>
    </div>
  );
}

export function AppLayout() {
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
    <div className="min-h-svh bg-cream text-ink">
      <a
        className="fixed left-4 top-3 z-50 -translate-y-24 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0"
        href="#conteudo-principal"
        onClick={skipToPageContent}
      >
        Ir para o conteúdo
      </a>

      <aside className="sidebar-scroll fixed inset-y-0 left-0 z-30 hidden w-72 overflow-y-auto overflow-x-hidden rounded-r-[2rem] bg-brand-soft xl:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-ink/10 bg-cream/95 px-4 backdrop-blur xl:hidden">
        <button
          aria-expanded={menuOpen}
          aria-label="Abrir menu"
          className="grid size-11 place-items-center rounded-xl border border-ink/15 bg-white text-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30"
          onClick={() => setMenuOpen(true)}
          ref={menuTriggerRef}
          type="button"
        >
          <Icon name="menu" />
        </button>
        <span className="text-sm font-bold text-ink">Controle de Acesso</span>
        <span aria-hidden="true" className="size-11" />
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            aria-hidden="true"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-ink/45"
            onClick={() => setMenuOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <aside
            aria-label="Menu principal"
            aria-modal="true"
            className="sidebar-scroll absolute inset-y-0 left-0 w-[min(86vw,20rem)] overflow-y-auto overflow-x-hidden rounded-r-[2rem] bg-brand-soft shadow-2xl"
            ref={menuDialogRef}
            role="dialog"
          >
            <button
              aria-label="Fechar menu"
              className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/65 text-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink"
              onClick={() => setMenuOpen(false)}
              ref={menuCloseRef}
              type="button"
            >
              <Icon name="x" />
            </button>
            <SidebarContent closeMenu={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main
        className="min-h-svh min-w-0 max-w-full bg-cream xl:pl-72"
        id="conteudo-principal"
        tabIndex={-1}
      >
        <div className="mx-auto min-w-0 w-full max-w-[94rem] px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          {sessionNotice === "renewal-unavailable" && (
            <div
              aria-atomic="true"
              className="mb-5 rounded-2xl border border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950"
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
