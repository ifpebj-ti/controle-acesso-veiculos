import type { AuthenticatedUser } from "../features/authentication/types";
import { canProfileAccessRoute } from "./routeMetadata";

export function getLoginDestination(
  user: AuthenticatedUser,
  requestedPath: unknown,
): string {
  if (user.requiresPasswordChange) return "/conta/senha";

  if (
    typeof requestedPath !== "string" ||
    !canProfileAccessRoute(user.profileName, requestedPath) ||
    requestedPath.replace(/\/+$/, "") === "/conta/senha"
  ) {
    return "/visao-geral";
  }

  return requestedPath;
}
