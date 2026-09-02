import { useContext } from "react";

import { SessionContext } from "./SessionContext";

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}

export function useAuthenticatedSession() {
  const session = useSession();

  if (!session.user || session.status !== "authenticated") {
    throw new Error("An authenticated session is required.");
  }

  return { ...session, user: session.user };
}
