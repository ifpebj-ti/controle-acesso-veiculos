import axios from "axios";
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
  setApiSessionRefreshHandler,
  setApiUnauthorizedHandler,
} from "../../../services/api";
import {
  AuthenticationContractError,
  authenticate,
  logoutAuthentication,
  refreshAuthentication,
} from "../services/authenticationService";
import type {
  AuthenticatedSession,
  AuthenticatedUser,
  LoginCredentials,
  SessionEndReason,
  SessionNotice,
} from "../types";
import { SessionContext, type SessionContextValue } from "./SessionContext";
import {
  broadcastSessionEnded,
  runWithSessionRefreshLock,
  subscribeToSessionEvents,
} from "./sessionCoordination";

interface SessionState {
  expiresAtUtc: string | null;
  sessionEndReason: SessionEndReason;
  sessionNotice: SessionNotice;
  status: SessionContextValue["status"];
  user: AuthenticatedUser | null;
}

const unauthenticatedState: SessionState = {
  expiresAtUtc: null,
  sessionEndReason: null,
  sessionNotice: null,
  status: "unauthenticated",
  user: null,
};

const initialState: SessionState = {
  ...unauthenticatedState,
  status: "restoring",
};

const renewalLeadMilliseconds = 60_000;
const renewalRetryMilliseconds = 15_000;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const expirationTimer = useRef<number | null>(null);
  const refreshInFlight = useRef<Promise<AuthenticatedSession> | null>(null);
  const renewalTimer = useRef<number | null>(null);
  const sessionGeneration = useRef(0);
  const currentExpiration = useRef<number | null>(null);
  const mounted = useRef(false);
  const endSessionRef = useRef<
    (reason: SessionEndReason, broadcast: boolean) => void
  >(() => undefined);
  const refreshAccessTokenRef = useRef<() => Promise<string>>(async () => {
    throw new Error("Session refresh is not initialized.");
  });

  const clearTimers = useCallback(() => {
    if (expirationTimer.current !== null) {
      window.clearTimeout(expirationTimer.current);
      expirationTimer.current = null;
    }
    if (renewalTimer.current !== null) {
      window.clearTimeout(renewalTimer.current);
      renewalTimer.current = null;
    }
    currentExpiration.current = null;
  }, []);

  const endSession = useCallback(
    (reason: SessionEndReason, broadcast: boolean) => {
      sessionGeneration.current += 1;
      clearTimers();
      setApiAccessToken(null);
      setState({ ...unauthenticatedState, sessionEndReason: reason });
      if (broadcast) broadcastSessionEnded();
    },
    [clearTimers],
  );

  const scheduleRenewalRetry = useCallback(() => {
    if (
      currentExpiration.current === null ||
      currentExpiration.current <= Date.now() + 1_000
    ) {
      return;
    }

    const delay = Math.min(
      renewalRetryMilliseconds,
      currentExpiration.current - Date.now() - 1_000,
    );
    renewalTimer.current = window.setTimeout(() => {
      void refreshAccessTokenRef.current().catch(() => undefined);
    }, delay);
  }, []);

  const applySession = useCallback(
    (session: AuthenticatedSession) => {
      const expiresAt = Date.parse(session.expiresAtUtc);
      const expiresInMilliseconds = expiresAt - Date.now();

      if (!Number.isFinite(expiresAt) || expiresInMilliseconds <= 0) {
        throw new AuthenticationContractError();
      }

      clearTimers();
      currentExpiration.current = expiresAt;
      setApiAccessToken(session.accessToken);
      expirationTimer.current = window.setTimeout(
        () => endSessionRef.current("expired", false),
        expiresInMilliseconds,
      );
      const leadTime = Math.min(
        renewalLeadMilliseconds,
        Math.max(1_000, Math.floor(expiresInMilliseconds / 2)),
      );
      renewalTimer.current = window.setTimeout(
        () => {
          void refreshAccessTokenRef.current().catch(() => undefined);
        },
        Math.max(0, expiresInMilliseconds - leadTime),
      );
      setState({
        expiresAtUtc: session.expiresAtUtc,
        sessionEndReason: null,
        sessionNotice: null,
        status: "authenticated",
        user: session.user,
      });
    },
    [clearTimers],
  );

  const requestRefresh = useCallback(() => {
    if (refreshInFlight.current) return refreshInFlight.current;

    const request = runWithSessionRefreshLock(refreshAuthentication).finally(
      () => {
        if (refreshInFlight.current === request) {
          refreshInFlight.current = null;
        }
      },
    );
    refreshInFlight.current = request;
    return request;
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const generation = sessionGeneration.current;

    try {
      const session = await requestRefresh();
      if (generation !== sessionGeneration.current) {
        throw new Error("Session changed while refresh was in progress.");
      }
      if (mounted.current) applySession(session);
      else setApiAccessToken(session.accessToken);
      return session.accessToken;
    } catch (error) {
      const rejected =
        axios.isAxiosError(error) && error.response?.status === 401;
      const invalidContract = error instanceof AuthenticationContractError;

      if (rejected || invalidContract) {
        if (mounted.current) endSession("unauthorized", true);
        else setApiAccessToken(null);
      } else if (mounted.current) {
        setState((current) =>
          current.status === "authenticated"
            ? { ...current, sessionNotice: "renewal-unavailable" }
            : current,
        );
        scheduleRenewalRetry();
      }

      throw error;
    }
  }, [applySession, endSession, requestRefresh, scheduleRenewalRetry]);

  useEffect(() => {
    endSessionRef.current = endSession;
    refreshAccessTokenRef.current = refreshAccessToken;
  }, [endSession, refreshAccessToken]);

  useEffect(() => {
    mounted.current = true;
    setApiSessionRefreshHandler(refreshAccessToken);
    setApiUnauthorizedHandler(() => endSession("unauthorized", true));
    const unsubscribe = subscribeToSessionEvents(() => {
      endSession("unauthorized", false);
    });
    let active = true;
    const restorationGeneration = sessionGeneration.current;

    void requestRefresh()
      .then((session) => {
        if (active && restorationGeneration === sessionGeneration.current) {
          applySession(session);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const noRenewableSession =
          axios.isAxiosError(error) && error.response?.status === 401;
        setApiAccessToken(null);
        setState({
          ...unauthenticatedState,
          sessionEndReason: noRenewableSession
            ? null
            : "restoration-unavailable",
        });
      });

    return () => {
      active = false;
      mounted.current = false;
      unsubscribe();
      setApiSessionRefreshHandler(null);
      setApiUnauthorizedHandler(null);
      setApiAccessToken(null);
      clearTimers();
    };
  }, [
    applySession,
    clearTimers,
    endSession,
    refreshAccessToken,
    requestRefresh,
  ]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      sessionGeneration.current += 1;
      clearTimers();
      setApiAccessToken(null);
      setState({ ...unauthenticatedState, status: "authenticating" });

      try {
        const session = await authenticate(credentials);
        applySession(session);
        return session.user;
      } catch (error) {
        endSession(null, false);
        throw error;
      }
    },
    [applySession, clearTimers, endSession],
  );

  const logout = useCallback(async () => {
    endSession(null, true);
    const logoutGeneration = sessionGeneration.current;

    try {
      await logoutAuthentication();
    } catch {
      if (mounted.current && sessionGeneration.current === logoutGeneration) {
        setState({
          ...unauthenticatedState,
          sessionEndReason: "logout-unconfirmed",
        });
      }
    }
  }, [endSession]);

  const completePasswordChange = useCallback(() => {
    endSession("password-changed", true);
  }, [endSession]);

  const value = useMemo<SessionContextValue>(
    () => ({ ...state, completePasswordChange, login, logout }),
    [completePasswordChange, login, logout, state],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
