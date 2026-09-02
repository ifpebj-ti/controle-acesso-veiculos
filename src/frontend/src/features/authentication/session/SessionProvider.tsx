import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  setApiAccessToken,
  setApiUnauthorizedHandler,
} from "../../../services/api";
import { authenticate } from "../services/authenticationService";
import type {
  AuthenticatedUser,
  LoginCredentials,
  SessionEndReason,
} from "../types";
import { SessionContext, type SessionContextValue } from "./SessionContext";

interface SessionState {
  expiresAtUtc: string | null;
  sessionEndReason: SessionEndReason;
  status: SessionContextValue["status"];
  user: AuthenticatedUser | null;
}

const initialState: SessionState = {
  expiresAtUtc: null,
  sessionEndReason: null,
  status: "unauthenticated",
  user: null,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const expirationTimer = useRef<number | null>(null);

  const clearExpirationTimer = useCallback(() => {
    if (expirationTimer.current !== null) {
      window.clearTimeout(expirationTimer.current);
      expirationTimer.current = null;
    }
  }, []);

  const endSession = useCallback(
    (reason: SessionEndReason) => {
      clearExpirationTimer();
      setApiAccessToken(null);
      setState({ ...initialState, sessionEndReason: reason });
    },
    [clearExpirationTimer],
  );

  useEffect(() => {
    setApiUnauthorizedHandler(() => endSession("unauthorized"));

    return () => {
      setApiUnauthorizedHandler(null);
      setApiAccessToken(null);
      clearExpirationTimer();
    };
  }, [clearExpirationTimer, endSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      clearExpirationTimer();
      setApiAccessToken(null);
      setState({ ...initialState, status: "authenticating" });

      try {
        const session = await authenticate(credentials);
        const expiresAt = Date.parse(session.expiresAtUtc);
        const expiresInMilliseconds = expiresAt - Date.now();

        if (!Number.isFinite(expiresAt) || expiresInMilliseconds <= 0) {
          throw new Error("The authentication response is already expired.");
        }

        setApiAccessToken(session.accessToken);
        expirationTimer.current = window.setTimeout(
          () => endSession("expired"),
          expiresInMilliseconds,
        );
        setState({
          expiresAtUtc: session.expiresAtUtc,
          sessionEndReason: null,
          status: "authenticated",
          user: session.user,
        });
      } catch (error) {
        endSession(null);
        throw error;
      }
    },
    [clearExpirationTimer, endSession],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      login,
      logout: () => endSession(null),
    }),
    [endSession, login, state],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
