import { AxiosError, AxiosHeaders, CanceledError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { UserAccountsContractError } from "../services/userAccountsService";
import { credentialResetReasons } from "../types";
import {
  LocalReactivationResetRequiredError,
  reactivateGoogleAccount,
  reactivateLocalAccount,
  reactivationFailure,
} from "./accountReactivationService";

vi.mock("../../../services/api", () => ({ api: { post: vi.fn() } }));
const fixtureCredential = {
  temporaryCredential: "CREDENCIAL_FICTICIA_NAO_UTILIZAVEL",
  temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
};
function httpError(status: number, data: unknown = {}) {
  return new AxiosError(
    "Fictitious response",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status,
      statusText: "Fictitious",
      data,
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );
}

describe("candidate #668 reactivation contract", () => {
  beforeEach(() => vi.resetAllMocks());
  it("keeps Google on the bodyless 204 route and disables session mutation retries", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 204 });
    expect(await reactivateGoogleAccount(8)).toBeUndefined();
    expect(api.post).toHaveBeenCalledExactlyOnceWith(
      "/users/8/reactivation",
      undefined,
      { skipSessionRetry: true },
    );
  });
  it.each(credentialResetReasons)(
    "sends only the Local reason %s to the reset route",
    async (reason) => {
      vi.mocked(api.post).mockResolvedValue({
        status: 200,
        data: fixtureCredential,
        headers: { "cache-control": "no-store" },
      });
      expect(await reactivateLocalAccount(8, reason)).toEqual(
        fixtureCredential,
      );
      expect(api.post).toHaveBeenCalledExactlyOnceWith(
        "/users/8/reactivation-with-reset",
        { reason },
        { skipSessionRetry: true },
      );
    },
  );
  it.each([
    null,
    "<html>invalid</html>",
    { ...fixtureCredential, temporaryCredential: "" },
    { ...fixtureCredential, temporaryCredentialExpiresAtUtc: "invalid" },
    { ...fixtureCredential, extra: "unexpected" },
  ])(
    "rejects incompatible Local success without exposing response contents",
    async (data) => {
      vi.mocked(api.post).mockResolvedValue({ status: 200, data });
      const error = await reactivateLocalAccount(8, "Esquecimento").catch(
        (reason: unknown) => reason,
      );
      expect(error).toBeInstanceOf(UserAccountsContractError);
      expect((error as Error).message).not.toContain(
        fixtureCredential.temporaryCredential,
      );
      expect(api.post).toHaveBeenCalledTimes(1);
    },
  );
  it("rejects incompatible HTTP success statuses for both methods", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ status: 200, data: fixtureCredential })
      .mockResolvedValueOnce({ status: 204 });
    await expect(reactivateGoogleAccount(8)).rejects.toBeInstanceOf(
      UserAccountsContractError,
    );
    await expect(
      reactivateLocalAccount(8, "Esquecimento"),
    ).rejects.toBeInstanceOf(UserAccountsContractError);
    expect(api.post).toHaveBeenCalledTimes(2);
  });
  it("recognizes legacy Local refusal without automatically dispatching the other endpoint", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(
      httpError(409, { code: "local_reactivation_requires_credential_reset" }),
    );
    await expect(reactivateGoogleAccount(8)).rejects.toBeInstanceOf(
      LocalReactivationResetRequiredError,
    );
    expect(api.post).toHaveBeenCalledExactlyOnceWith(
      "/users/8/reactivation",
      undefined,
      { skipSessionRetry: true },
    );
  });
  it.each([400, 401, 403, 404, 409, 429, 500])(
    "propagates HTTP %s once without retry",
    async (status) => {
      const error = httpError(status);
      vi.mocked(api.post).mockRejectedValueOnce(error);
      await expect(reactivateLocalAccount(8, "Esquecimento")).rejects.toBe(
        error,
      );
      expect(api.post).toHaveBeenCalledTimes(1);
    },
  );
  it("keeps field rejection distinct from uncertain/blocked outcomes", () => {
    expect(
      reactivationFailure(
        httpError(400, { errors: { reason: ["Motivo fictício inválido."] } }),
      ),
    ).toMatchObject({
      kind: "retryable",
      reasonError: "Motivo fictício inválido.",
    });
    expect(reactivationFailure(httpError(429)).kind).toBe("retryable");
    for (const status of [401, 403, 404])
      expect(reactivationFailure(httpError(status)).kind).toBe("blocked");
    for (const error of [
      new CanceledError(),
      new DOMException("", "AbortError"),
      new AxiosError("", "ERR_NETWORK"),
      httpError(500),
      new UserAccountsContractError(),
    ])
      expect(reactivationFailure(error).kind).toBe("reconcile");
  });
});
