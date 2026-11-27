import { act, renderHook } from "@testing-library/react";
import { CanceledError } from "axios";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { changeAccountProfile } from "../services/userAccountsService";
import type { UserAccount } from "../types";
import { useAccountProfileChange } from "./useAccountProfileChange";

// Models the shared classification published by #608 without stacking its implementation.
vi.mock("../../../services/api-errors", () => ({
  describeApiError: () => ({
    kind: "cancelled",
    message: "A solicitação foi cancelada.",
  }),
}));
vi.mock("../services/userAccountsService", async (original) => ({
  ...(await original<typeof import("../services/userAccountsService")>()),
  changeAccountProfile: vi.fn(),
}));

const account: UserAccount = {
  id: 8,
  name: "Pessoa Fictícia",
  email: "pessoa@example.test",
  profileName: "Porteiro",
  active: true,
  authenticationMethod: "Google",
  externalIdentityLinked: true,
  createdAtUtc: "2030-06-10T11:00:00Z",
  updatedAtUtc: null,
  lockedUntilUtc: null,
  requiresPasswordChange: false,
  temporaryCredentialExpiresAtUtc: null,
};
const input = {
  profileName: "Vigilante" as const,
  reason: "Justificativa fictícia para conferência.",
};

describe("profile mutation cancellation with the #608 classifier", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    new CanceledError("fixture"),
    new DOMException("fixture", "AbortError"),
  ])(
    "requires read-only reconciliation and blocks fresh and stale confirmations after %s",
    async (failure) => {
      vi.mocked(changeAccountProfile).mockRejectedValue(failure);
      const onReload = vi.fn();
      const onSuccess = vi.fn();
      const { result } = renderHook(() => {
        const [pendingAction, setPendingAction] = useState<string | null>(null);
        return useAccountProfileChange({
          ready: true,
          pendingAction,
          setPendingAction,
          onReload,
          onSuccess,
          onDenied: vi.fn(),
        });
      });
      act(() => result.current.open(account, document.createElement("button")));
      const staleConfirm = result.current.confirm;
      await act(async () => result.current.confirm(input));
      expect(result.current.requiresReload).toBe(true);
      expect(result.current.error).toContain("pode ter sido recebida");
      await act(async () => result.current.confirm(input));
      await act(async () => staleConfirm(input));
      expect(changeAccountProfile).toHaveBeenCalledTimes(1);
      expect(onSuccess).not.toHaveBeenCalled();
      act(() => result.current.close());
      expect(onReload).toHaveBeenCalledTimes(1);
      expect(changeAccountProfile).toHaveBeenCalledTimes(1);
    },
  );
});
