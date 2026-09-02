export const profileNames = [
  "Porteiro",
  "Vigilante",
  "SetorTransporte",
  "Administrador",
] as const;

export type ProfileName = (typeof profileNames)[number];

export const profileLabels: Record<ProfileName, string> = {
  Administrador: "Administrador",
  Porteiro: "Porteiro",
  SetorTransporte: "Setor de Transporte",
  Vigilante: "Vigilante",
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  profileName: ProfileName;
}

export interface AuthenticatedSession {
  accessToken: string;
  expiresAtUtc: string;
  user: AuthenticatedUser;
}

export type SessionEndReason = "expired" | "unauthorized" | null;
