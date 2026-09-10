import type { ProfileName } from "../features/authentication";

const applicationTitle = "Controle de Acesso de Veículos";

interface RouteMetadata {
  allowedProfiles?: readonly ProfileName[];
  focusSelector?: string;
  title: string;
}

export const allProfiles: readonly ProfileName[] = [
  "Porteiro",
  "Vigilante",
  "SetorTransporte",
  "Administrador",
];

export const operationalProfiles: readonly ProfileName[] = [
  "Porteiro",
  "Vigilante",
  "Administrador",
];

export const routeMetadata: Readonly<Record<string, RouteMetadata>> = {
  "/login": { focusSelector: "#email", title: "Entrar" },
  "/visao-geral": { allowedProfiles: allProfiles, title: "Visão geral" },
  "/acessos/novo": {
    allowedProfiles: operationalProfiles,
    title: "Registrar entrada",
  },
  "/acessos/abertos": {
    allowedProfiles: operationalProfiles,
    title: "Acessos em aberto",
  },
  "/acessos/historico": {
    allowedProfiles: allProfiles,
    title: "Histórico de acessos",
  },
  "/utilizacoes-institucionais": {
    allowedProfiles: allProfiles,
    title: "Utilizações da frota",
  },
  "/frota": {
    allowedProfiles: allProfiles,
    title: "Frota institucional",
  },
  "/motoristas-institucionais": {
    allowedProfiles: allProfiles,
    title: "Motoristas autorizados",
  },
  "/eventos": {
    allowedProfiles: allProfiles,
    title: "Eventos e autorizações",
  },
  "/administracao": {
    allowedProfiles: ["Administrador"],
    title: "Administração",
  },
};

export function getRouteTitle(pathname: string, profileName?: ProfileName) {
  const normalizedPathname =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const metadata = routeMetadata[normalizedPathname];

  if (!metadata) return `Página não encontrada | ${applicationTitle}`;

  if (
    profileName &&
    metadata.allowedProfiles &&
    !metadata.allowedProfiles.includes(profileName)
  ) {
    return `Acesso negado | ${applicationTitle}`;
  }

  return `${metadata.title} | ${applicationTitle}`;
}

export function getRouteFocusSelector(pathname: string) {
  const normalizedPathname =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  return routeMetadata[normalizedPathname]?.focusSelector ?? "main h1";
}
