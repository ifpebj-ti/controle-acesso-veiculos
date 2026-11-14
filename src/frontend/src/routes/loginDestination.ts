import type { AuthenticatedUser } from "../features/authentication/types";
import { canShowPasswordChange } from "../features/authentication/passwordChangeVisibility";
import { canProfileAccessRoute } from "./routeMetadata";

export function getLoginDestination(
  user: AuthenticatedUser,
  requestedPath: unknown,
): string {
  if (user.requiresPasswordChange) return "/conta/senha";

  if (
    typeof requestedPath !== "string" ||
    !canProfileAccessRoute(user.profileName, requestedPath) ||
    (requestedPath.replace(/\/+$/, "") === "/conta/senha" &&
      !canShowPasswordChange(user))
  ) {
    return "/visao-geral";
  }

  return requestedPath;
}
