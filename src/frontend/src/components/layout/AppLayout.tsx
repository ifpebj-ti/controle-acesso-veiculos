import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  profileLabels,
  useAuthenticatedSession,
  type ProfileName,
} from "../../features/authentication";
import { Brand } from "../ui/Brand";
import { Icon, type IconName } from "../ui/Icon";

interface NavigationItem {
  label: string;
  icon: IconName;
  to: string;
  profiles?: ProfileName[];
}

interface NavigationSection {
  label: string;
  icon: IconName;
  items?: NavigationItem[];
  profiles?: ProfileName[];
  to?: string;
}

const operationalProfiles: ProfileName[] = ["Porteiro", "Vigilante"];

const registryProfiles: ProfileName[] = [
  "Porteiro",
  "Vigilante",
  "SetorTransporte",
  "Administrador",
];

const navigation: NavigationSection[] = [
  {
    icon: "dashboard",
    label: "Visão geral",
    to: "/visao-geral",
  },
  {
    icon: "history",
    label: "Movimentações",
    items: [
      {
        icon: "plus",
        label: "Registrar entrada",
        profiles: operationalProfiles,
        to: "/acessos/novo",
      },
      {
        icon: "clock",
        label: "Acessos em aberto",
        profiles: operationalProfiles,
        to: "/acessos/abertos",
      },
      { icon: "history", label: "Histórico", to: "/acessos/historico" },
    ],
  },
  {
    icon: "clipboard",
    label: "Cadastros",
    profiles: registryProfiles,
    items: [
      {
        icon: "bus",
        label: "Frota institucional",
        profiles: registryProfiles,
        to: "/frota",
      },
      {
        icon: "calendar",
        label: "Eventos e autorizações",
        profiles: registryProfiles,
        to: "/eventos",
      },
    ],
  },
  {
    icon: "users",
    label: "Usuários e permissões",
    profiles: ["Administrador"],
    to: "/administracao",
  },
];

function SidebarContent({ closeMenu }: { closeMenu?: () => void }) {
  const { logout, user } = useAuthenticatedSession();
  const navigate = useNavigate();
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
    logout();
    closeMenu?.();
    navigate("/login");
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-5 pt-6">
      <Brand compact className="mx-auto min-h-24" />

      <div className="mt-14 flex items-center gap-3 px-3">
        <span
          aria-hidden="true"
          className="grid size-13 shrink-0 place-items-center rounded-full bg-[#d9d9d9] text-ink/65"
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
            if (
              section.profiles &&
              !section.profiles.includes(user.profileName)
            ) {
              return null;
            }

            const items = section.items?.filter(
              (item) =>
                !item.profiles || item.profiles.includes(user.profileName),
            );
            const isExpanded = !collapsedSections.has(section.label);

            return (
              <li key={section.label}>
                {section.to ? (
                  <NavLink
                    className={({ isActive }) =>
                      `sidebar-primary-item flex min-h-12 items-center gap-3 rounded-l-2xl px-4 py-3 font-medium transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30 ${
                        isActive
                          ? "sidebar-primary-item--active bg-cream text-ink"
                          : "text-ink/85 hover:bg-white/45 hover:text-ink"
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
                      aria-expanded={isExpanded}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-ink/85 transition-colors hover:text-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
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

                    {isExpanded && items && (
                      <ul className="ml-6 mt-1 space-y-1 border-l border-ink/15 pl-3">
                        {items.map((item) => (
                          <li key={item.to}>
                            <NavLink
                              className={({ isActive }) =>
                                `flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30 ${
                                  isActive
                                    ? "bg-cream font-semibold text-ink shadow-sm"
                                    : "text-ink/70 hover:bg-white/45 hover:text-ink"
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
        className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-semibold text-ink transition-colors hover:bg-white/45 focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuDialogRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

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
      >
        Ir para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-y-auto overflow-x-hidden rounded-r-[2rem] bg-brand-soft shadow-[8px_0_28px_rgba(1,36,40,0.08)] lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-ink/10 bg-cream/95 px-4 backdrop-blur lg:hidden">
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
        <div className="fixed inset-0 z-40 lg:hidden">
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
            className="absolute inset-y-0 left-0 w-[min(86vw,20rem)] overflow-y-auto overflow-x-hidden rounded-r-[2rem] bg-brand-soft shadow-2xl"
            ref={menuDialogRef}
            role="dialog"
          >
            <button
              aria-label="Fechar menu"
              className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/65 text-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
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
        className="min-h-svh min-w-0 max-w-full lg:pl-72"
        id="conteudo-principal"
        tabIndex={-1}
      >
        <div className="border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-950 sm:text-sm lg:px-8">
          Sessão autenticada pela API — movimentações gerais integradas; demais
          módulos permanecem em demonstração.
        </div>
        <div className="mx-auto min-w-0 w-full max-w-[94rem] px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
