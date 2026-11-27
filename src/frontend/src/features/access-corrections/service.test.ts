import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../services/api";
import {
  correctionKey,
  pendingCorrection,
  terminalCorrection,
} from "../../test/correctionReviewFixtures";
import {
  CorrectionReviewContractError,
  decideCorrectionRequest,
  findOwnCorrectionRequest,
  getCorrectionRequest,
  searchCorrectionRequests,
  submitCorrectionRequest,
} from "./service";

vi.mock("../../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));
const input = {
  requestKey: correctionKey,
  original: pendingCorrection.original,
  proposed: pendingCorrection.proposed,
  justification: pendingCorrection.justification,
};
describe("candidate #607 correction review contract", () => {
  beforeEach(() => vi.resetAllMocks());
  it("uses only the documented submission endpoint without session retry or actor fields", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: pendingCorrection });
    await expect(submitCorrectionRequest(10, input)).resolves.toEqual(
      pendingCorrection,
    );
    expect(api.post).toHaveBeenCalledExactlyOnceWith(
      "/access-records/10/correction-requests",
      input,
      { skipSessionRetry: true },
    );
    expect(api.put).not.toHaveBeenCalled();
  });
  it.each(["Approve", "Reject", "Cancel"] as const)(
    "uses the exact %s mutation and never repeats it",
    async (action) => {
      vi.mocked(api.post).mockResolvedValue({
        data: terminalCorrection(
          action === "Approve"
            ? "Aprovada"
            : action === "Reject"
              ? "Rejeitada"
              : "Cancelada",
        ),
      });
      await decideCorrectionRequest(
        31,
        action,
        "Motivo fictício para decisão.",
      );
      expect(api.post).toHaveBeenCalledExactlyOnceWith(
        `/access-correction-requests/31/${action === "Cancel" ? "cancellation" : "decision"}`,
        action === "Cancel"
          ? { justification: "Motivo fictício para decisão." }
          : {
              decision: action,
              justification: "Motivo fictício para decisão.",
            },
        { skipSessionRetry: true },
      );
    },
  );
  it("reconciles only by GET and supports nullable plate and separate internal identification", async () => {
    const request = {
      ...pendingCorrection,
      plate: null,
      vehicleIdentification: "Identificação fictícia A",
    };
    vi.mocked(api.get).mockResolvedValue({ data: request });
    await expect(findOwnCorrectionRequest(correctionKey)).resolves.toEqual(
      request,
    );
    await getCorrectionRequest(31);
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      `/access-correction-requests/by-key/${correctionKey}`,
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "/access-correction-requests/31",
    );
    expect(api.post).not.toHaveBeenCalled();
  });
  it("sends only status and real pagination filters", async () => {
    const page = {
      items: [pendingCorrection],
      page: 2,
      pageSize: 25,
      totalCount: 26,
      totalPages: 2,
    };
    vi.mocked(api.get).mockResolvedValue({ data: page });
    await expect(searchCorrectionRequests("Pendente", 2)).resolves.toEqual(
      page,
    );
    expect(api.get).toHaveBeenCalledWith("/access-correction-requests", {
      params: { status: "Pendente", page: 2, pageSize: 25 },
    });
  });
  it.each([
    { ...pendingCorrection, status: "Unknown" },
    { ...pendingCorrection, document: "unexpected-fixture" },
    { ...pendingCorrection, status: "Aprovada" },
    { ...pendingCorrection, requestedAtUtc: "invalid" },
    { ...pendingCorrection, id: 32 },
  ])(
    "rejects unknown, inconsistent or incorrectly bound responses",
    async (request) => {
      vi.mocked(api.get).mockResolvedValue({ data: request });
      await expect(getCorrectionRequest(31)).rejects.toBeInstanceOf(
        CorrectionReviewContractError,
      );
    },
  );
  it("rejects a response bound to a different key before announcing success", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        ...pendingCorrection,
        requestKey: "aa8f1826-24f3-4b93-8bb2-af18daea0e03",
      },
    });
    await expect(submitCorrectionRequest(10, input)).rejects.toBeInstanceOf(
      CorrectionReviewContractError,
    );
  });
  it.each([400, 401, 403, 409, 429, 500])(
    "does not repeat mutation on HTTP %s",
    async (status) => {
      const failure = { isAxiosError: true, response: { status, data: {} } };
      vi.mocked(api.post).mockRejectedValue(failure);
      await expect(submitCorrectionRequest(10, input)).rejects.toBe(failure);
      expect(api.post).toHaveBeenCalledTimes(1);
    },
  );
  it("treats own-key 404 as absence only, not permission to submit again", async () => {
    vi.mocked(api.get).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });
    await expect(findOwnCorrectionRequest(correctionKey)).resolves.toBeNull();
    expect(api.post).not.toHaveBeenCalled();
  });
});
