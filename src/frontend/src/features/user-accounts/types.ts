import type { ProfileName } from "../authentication";

export interface UserAccount {
  authenticationMethod: "Local" | "Google";
  externalIdentityLinked: boolean;
  id: number;
  name: string;
  email: string;
  profileName: ProfileName;
  active: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  lockedUntilUtc: string | null;
  requiresPasswordChange: boolean;
  temporaryCredentialExpiresAtUtc: string | null;
}

export interface UserAccountPage {
  items: UserAccount[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UserAccountFilters {
  search: string;
  active?: boolean;
  page: number;
  pageSize: number;
}

export interface CreateUserAccountInput {
  name: string;
  email: string;
  profileName: ProfileName;
}

export interface CreatedUserAccount {
  authenticationMethod: "Local" | "Google";
  id: number;
  email: string;
  profileName: ProfileName;
  temporaryCredential: string | null;
  temporaryCredentialExpiresAtUtc: string | null;
}

export interface ChangeAccountProfileInput {
  profileName: ProfileName;
  reason: string;
}

export interface ChangedAccountProfile {
  previousProfileName: ProfileName;
  currentProfileName: ProfileName;
  authenticationMethod: "Local" | "Google";
  temporaryCredential: string | null;
  temporaryCredentialExpiresAtUtc: string | null;
}

export const credentialResetReasons = [
  "Esquecimento",
  "SuspeitaComprometimento",
  "ProvisionamentoCorretivo",
] as const;

export type CredentialResetReason = (typeof credentialResetReasons)[number];

export interface TemporaryCredential {
  temporaryCredential: string;
  temporaryCredentialExpiresAtUtc: string;
}

export type UserAccountServerErrors = Partial<
  Record<"email" | "name" | "profileName", string>
>;
