import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSession } from "../features/authentication";

export function ProtectedRoute() {
  const location = useLocation();
  const { status, user } = useSession();

  if (status === "authenticating") {
    return (
      <main
        aria-busy="true"
        className="grid min-h-svh place-items-center bg-cream px-4 text-center text-ink"
      >
        <div>
          <span
            aria-hidden="true"
            className="mx-auto block size-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand-dark"
          />
          <p className="mt-4 font-semibold">Validando sua sessão…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
