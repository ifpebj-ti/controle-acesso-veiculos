import { act, renderHook } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { CanceledError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserAccountsContractError } from "../services/userAccountsService";
import {
  LocalReactivationResetRequiredError,
  reactivateGoogleAccount,
  reactivateLocalAccount,
} from "./accountReactivationService";
import type { ReactivationAccount } from "./types";
import { useAccountReactivation } from "./useAccountReactivation";

vi.mock("./accountReactivationService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./accountReactivationService")>()),
  reactivateGoogleAccount: vi.fn(),
  reactivateLocalAccount: vi.fn(),
}));
const local: ReactivationAccount = {
  id: 8,
  name: "Pessoa fictícia",
  active: false,
  authenticationMethod: "Local",
};
const google: ReactivationAccount = {
  ...local,
  authenticationMethod: "Google",
};
const fixtureCredential = {
  temporaryCredential: "CREDENCIAL_FICTICIA_NAO_UTILIZAVEL",
  temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
};
function setup(
  account = local,
  read = vi.fn<() => Promise<ReactivationAccount | null>>(),
) {
  return {
    ...renderHook(() => useAccountReactivation(account, read), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StrictMode>{children}</StrictMode>
      ),
    }),
    read,
  };
}
describe("independent reactivation orchestration", () => {
  beforeEach(() => vi.resetAllMocks());
  it("requires a Local reason and clears the disclosed credential on close", async () => {
    vi.mocked(reactivateLocalAccount).mockResolvedValue(fixtureCredential);
    const { result } = setup();
    await act(() => result.current.confirm());
    expect(reactivateLocalAccount).not.toHaveBeenCalled();
    expect(result.current.reasonError).toBeTruthy();
    act(() => result.current.changeReason("Esquecimento"));
    await act(() => result.current.confirm());
    expect(result.current.credential).toEqual(fixtureCredential);
    expect(reactivateLocalAccount).toHaveBeenCalledExactlyOnceWith(
      8,
      "Esquecimento",
    );
    act(() => {
      result.current.close();
    });
    expect(result.current.credential).toBeNull();
    expect(result.current.reason).toBe("");
    await act(() => result.current.confirm());
    expect(reactivateLocalAccount).toHaveBeenCalledTimes(1);
  });
  it("chooses Google from the canonical method, not a reason or profile", async () => {
    const { result } = setup(google);
    await act(() => result.current.confirm());
    expect(reactivateGoogleAccount).toHaveBeenCalledExactlyOnceWith(8);
    expect(reactivateLocalAccount).not.toHaveBeenCalled();
    expect(result.current.credential).toBeNull();
    expect(result.current.phase).toBe("completed");
  });
  it("synchronously blocks duplicate confirmation while pending", async () => {
    let finish!: () => void;
    vi.mocked(reactivateGoogleAccount).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = setup(google);
    const send = result.current.confirm;
    let pending!: Promise<void>;
    act(() => {
      pending = send();
      void send();
    });
    expect(reactivateGoogleAccount).toHaveBeenCalledTimes(1);
    act(() => {
      expect(result.current.close()).toBe(false);
    });
    await act(async () => {
      finish();
      await pending;
    });
    expect(result.current.phase).toBe("completed");
  });
  it.each([
    new CanceledError(),
    new DOMException("", "AbortError"),
    new UserAccountsContractError(),
    new Error("Fictitious lost response"),
  ])(
    "locks uncertain outcomes and stale callbacks, reconciling only by reading",
    async (error) => {
      vi.mocked(reactivateLocalAccount).mockRejectedValue(error);
      const read = vi
        .fn<() => Promise<ReactivationAccount | null>>()
        .mockResolvedValueOnce({ ...local, active: true });
      const { result } = setup(local, read);
      act(() => result.current.changeReason("SuspeitaComprometimento"));
      const stale = result.current.confirm;
      await act(() => stale());
      expect(result.current.phase).toBe("reconcile");
      expect(result.current.reason).toBe("SuspeitaComprometimento");
      await act(() => stale());
      expect(reactivateLocalAccount).toHaveBeenCalledTimes(1);
      await act(() => result.current.reconcile());
      expect(read).toHaveBeenCalledTimes(1);
      expect(result.current.message).toContain("não confirma o recebimento");
      expect(result.current.credential).toBeNull();
      await act(() => stale());
      expect(reactivateLocalAccount).toHaveBeenCalledTimes(1);
    },
  );
  it("does not treat absent, inactive or failed readback as rollback", async () => {
    vi.mocked(reactivateGoogleAccount).mockRejectedValue(new CanceledError());
    const read = vi
      .fn<() => Promise<ReactivationAccount | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(google)
      .mockRejectedValueOnce(new Error("Fictitious read failure"));
    const { result } = setup(google, read);
    await act(() => result.current.confirm());
    for (let i = 0; i < 3; i++) {
      await act(() => result.current.reconcile());
      await act(() => result.current.confirm());
    }
    expect(reactivateGoogleAccount).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(3);
    expect(result.current.message).toContain(
      "Nenhuma reativação foi reenviada",
    );
  });
  it("uses only a read to refresh a stale canonical method after legacy refusal", async () => {
    vi.mocked(reactivateGoogleAccount).mockRejectedValue(
      new LocalReactivationResetRequiredError(),
    );
    const read = vi
      .fn<() => Promise<ReactivationAccount | null>>()
      .mockResolvedValue(local);
    const { result } = setup(google, read);
    await act(() => result.current.confirm());
    await act(() => result.current.reconcile());
    expect(result.current.account.authenticationMethod).toBe("Local");
    expect(result.current.message).toContain("nova confirmação");
    await act(() => result.current.confirm());
    expect(reactivateGoogleAccount).toHaveBeenCalledTimes(1);
    expect(reactivateLocalAccount).not.toHaveBeenCalled();
  });
  it("ignores late completion after exit", async () => {
    let finish!: (value: typeof fixtureCredential) => void;
    vi.mocked(reactivateLocalAccount).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result, unmount } = setup();
    act(() => result.current.changeReason("Esquecimento"));
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.confirm();
    });
    unmount();
    await act(async () => {
      finish(fixtureCredential);
      await pending;
    });
    expect(reactivateLocalAccount).toHaveBeenCalledTimes(1);
  });
  it("rejects active or unknown-method metadata before any request", async () => {
    const { result } = setup({ ...local, active: true });
    await act(() => result.current.confirm());
    expect(result.current.phase).toBe("blocked");
    expect(reactivateLocalAccount).not.toHaveBeenCalled();
  });
});
