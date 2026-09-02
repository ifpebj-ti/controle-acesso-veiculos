import { createContext } from "react";

import type {
  AuthenticatedUser,
  LoginCredentials,
  SessionEndReason,
} from "../types";

export interface SessionContextValue {
  expiresAtUtc: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  sessionEndReason: SessionEndReason;
  status: "authenticated" | "authenticating" | "unauthenticated";
  user: AuthenticatedUser | null;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
