import type { PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SessionContext, type SessionContextValue } from "./SessionContext";
import { useAuthenticatedSession, useSession } from "./useSession";

function contextValue(
  overrides: Partial<SessionContextValue> = {},
): SessionContextValue {
  return {
    completePasswordChange: vi.fn(),
    expiresAtUtc: null,
    login: vi.fn(),
    logout: vi.fn(),
    sessionEndReason: null,
    status: "unauthenticated",
    user: null,
    ...overrides,
  };
}

function wrapper(value: SessionContextValue) {
  return function SessionWrapper({ children }: PropsWithChildren) {
    return (
      <SessionContext.Provider value={value}>
        {children}
      </SessionContext.Provider>
    );
  };
}

describe("session hooks", () => {
  it("rejects use outside the session provider", () => {
    expect(() => renderHook(() => useSession())).toThrow(
      "useSession must be used within SessionProvider",
    );
  });

  it("returns the current session context", () => {
    const value = contextValue();

    const { result } = renderHook(() => useSession(), {
      wrapper: wrapper(value),
    });

    expect(result.current).toBe(value);
  });

  it.each([
    ["missing user", contextValue({ status: "authenticated" })],
    [
      "non-authenticated status",
      contextValue({
        status: "restoring",
        user: {
          email: "operator@example.test",
          id: 7,
          profileName: "Porteiro",
          requiresPasswordChange: false,
        },
      }),
    ],
  ])("rejects an authenticated session with %s", (_scenario, value) => {
    expect(() =>
      renderHook(() => useAuthenticatedSession(), {
        wrapper: wrapper(value),
      }),
    ).toThrow("An authenticated session is required.");
  });

  it("returns a narrowed authenticated user", () => {
    const user = {
      email: "operator@example.test",
      id: 7,
      profileName: "Vigilante" as const,
      requiresPasswordChange: false,
    };
    const value = contextValue({ status: "authenticated", user });

    const { result } = renderHook(() => useAuthenticatedSession(), {
      wrapper: wrapper(value),
    });

    expect(result.current.user).toBe(user);
    expect(result.current.status).toBe("authenticated");
  });
});
