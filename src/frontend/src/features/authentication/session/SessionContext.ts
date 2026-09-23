import { createContext } from "react";

import type {
  AuthenticatedUser,
  LoginCredentials,
  SessionEndReason,
  SessionNotice,
} from "../types";

export interface SessionContextValue {
  completePasswordChange: () => void;
  expiresAtUtc: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  sessionEndReason: SessionEndReason;
  sessionNotice?: SessionNotice;
  status: "authenticated" | "authenticating" | "restoring" | "unauthenticated";
  user: AuthenticatedUser | null;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
