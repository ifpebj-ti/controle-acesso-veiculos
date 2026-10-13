import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSession } from "../features/authentication";
import { SessionLoadingState } from "../components/ui/SessionLoadingState";

export function ProtectedRoute() {
  const location = useLocation();
  const { status, user } = useSession();

  if (status === "authenticating" || status === "restoring") {
    return <SessionLoadingState title="Validando sua sessão…" />;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (
    user.requiresPasswordChange &&
    location.pathname.replace(/\/+$/, "") !== "/conta/senha"
  ) {
    return <Navigate replace to="/conta/senha" />;
  }

  return <Outlet />;
}
