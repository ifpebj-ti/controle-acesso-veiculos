import type { AuthenticatedUser } from "./types";

// Presentation only: the API still validates the account's authentication method.
// Preserve first-access completion when the API explicitly requires it.
export function canShowPasswordChange(user: AuthenticatedUser): boolean {
  return user.profileName === "Administrador" || user.requiresPasswordChange;
}
