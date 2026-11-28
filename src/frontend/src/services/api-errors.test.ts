import { AxiosError, AxiosHeaders, CanceledError } from "axios";
import { describe, expect, it } from "vitest";

import { UserAccountsContractError } from "../features/user-accounts/services/userAccountsService";
import { AccessRecordsContractError } from "../features/access-records/services/accessRecordsService";
import { EventAuthorizationsContractError } from "../features/event-authorizations/services/eventAuthorizationsService";
import { InstitutionalVehiclesContractError } from "../features/institutional-vehicles/services/institutionalVehiclesService";
import { InstitutionalDriversContractError } from "../features/institutional-drivers/services/institutionalDriversService";
import { InstitutionalUsagesContractError } from "../features/institutional-usages/services/institutionalUsagesService";
import { AdministrativeReportsContractError } from "../features/administrative-reports/services/administrativeReportsService";
import { AuthenticationContractError } from "../features/authentication/services/authenticationService";
import { OperationalSummaryContractError } from "../features/operational-summary/services/operationalSummaryService";
import { AuditTrailContractError } from "../features/audit-trail/services/auditTrailService";
import { describeApiError, getApiValidationErrors } from "./api-errors";

function httpFailure(status: number, data: unknown = {}) {
  return new AxiosError(
    "internal-test-only",
    "ERR_BAD_RESPONSE",
    undefined,
    undefined,
    {
      status,
      data,
      statusText: "",
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );
}

describe("describeApiError", () => {
  it.each([
    UserAccountsContractError,
    AccessRecordsContractError,
    EventAuthorizationsContractError,
    InstitutionalVehiclesContractError,
    InstitutionalDriversContractError,
    InstitutionalUsagesContractError,
    AdministrativeReportsContractError,
    AuthenticationContractError,
    OperationalSummaryContractError,
    AuditTrailContractError,
  ])("does not blame the network for %s", (ContractError) => {
    const error = new ContractError();
    expect(describeApiError(error)).toEqual({
      kind: "unexpected",
      message:
        "O sistema encontrou um erro inesperado. Tente novamente mais tarde.",
    });
    expect(describeApiError(error).message).not.toContain(error.message);
  });

  it.each([
    new Error("internal-test-only"),
    new TypeError("internal-test-only"),
    null,
    undefined,
    "internal-test-only",
  ])("keeps unknown failures generic and private: %s", (failure) => {
    expect(describeApiError(failure).kind).toBe("unexpected");
    expect(describeApiError(failure).message).not.toMatch(
      /Verifique a rede|internal-test-only/,
    );
  });

  it.each([
    "ERR_NETWORK",
    "ECONNABORTED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNRESET",
    "ECONNREFUSED",
    "EAI_AGAIN",
  ])("describes a transport failure as a connection problem: %s", (code) => {
    expect(
      describeApiError(new AxiosError("internal-test-only", code)),
    ).toEqual({
      kind: "network",
      message:
        "Não foi possível conectar ao sistema. Verifique a rede e tente novamente.",
    });
  });

  it("recognizes an unanswered transport request without a code", () => {
    expect(
      describeApiError(new AxiosError("fixture", undefined, undefined, {}))
        .kind,
    ).toBe("network");
  });

  it.each([
    undefined,
    "ERR_BAD_OPTION_VALUE",
    "ERR_INVALID_URL",
    "ERR_BAD_REQUEST",
  ])("does not classify Axios setup failures as transport: %s", (code) => {
    expect(
      describeApiError(new AxiosError("internal-test-only", code)).kind,
    ).toBe("unexpected");
  });

  it.each([
    new CanceledError("internal-test-only"),
    new AxiosError("internal-test-only", "ERR_CANCELED"),
    new DOMException("internal-test-only", "AbortError"),
  ])(
    "distinguishes cancellation without exposing its reason: %s",
    (failure) => {
      expect(describeApiError(failure)).toEqual({
        kind: "cancelled",
        message: "A solicitação foi cancelada.",
      });
    },
  );

  it.each([
    [400, "validation"],
    [422, "validation"],
    [401, "session-expired"],
    [403, "access-denied"],
    [409, "conflict"],
    [429, "rate-limited"],
    [500, "unexpected"],
    [502, "unexpected"],
    [503, "unexpected"],
  ])("preserves HTTP %s semantics", (status, kind) => {
    const error = httpFailure(status as number, { message: "fixture-message" });
    expect(describeApiError(error)).toMatchObject({ status, kind });
    if (status !== 409)
      expect(describeApiError(error).message).not.toContain("fixture-message");
  });

  it("keeps field validation and documented conflict messages", () => {
    const error = httpFailure(400, {
      errors: { name: ["Revise o nome fictício."] },
    });
    expect(getApiValidationErrors(error)).toEqual({
      name: "Revise o nome fictício.",
    });
    expect(describeApiError(error).message).toBe("Revise o nome fictício.");
    expect(
      describeApiError(httpFailure(409, { message: "Conflito fictício." }))
        .message,
    ).toBe("Conflito fictício.");
  });
});
