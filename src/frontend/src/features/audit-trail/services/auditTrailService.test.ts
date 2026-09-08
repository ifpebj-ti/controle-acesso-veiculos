import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import { searchAuditTrail } from "./auditTrailService";

vi.mock("../../../services/api", () => ({
  api: { get: vi.fn() },
}));

const auditEntry = {
  action: "Alteracao",
  actorType: "Human",
  actorUserId: 4,
  details: "Conta fictícia desativada.",
  entity: "Usuario",
  id: 11,
  newState: { active: false },
  occurredAtUtc: "2030-06-10T11:00:00Z",
  previousState: { active: true },
  recordId: 8,
};

describe("auditTrailService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries the documented audit filters and validates the response", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [auditEntry],
        page: 2,
        pageSize: 25,
        totalCount: 26,
        totalPages: 2,
      },
    });

    const result = await searchAuditTrail({
      action: "Alteracao",
      actorUserId: 4,
      entity: " Usuario ",
      fromUtc: "2030-05-12T08:00",
      page: 2,
      pageSize: 25,
      recordId: 8,
      systemOnly: false,
      toUtc: "2030-06-10T08:00",
    });

    expect(api.get).toHaveBeenCalledWith("/audits", {
      params: {
        action: "Alteracao",
        actorUserId: 4,
        entity: "Usuario",
        fromUtc: new Date("2030-05-12T08:00").toISOString(),
        page: 2,
        pageSize: 25,
        recordId: 8,
        systemOnly: false,
        toUtc: new Date("2030-06-10T08:00").toISOString(),
      },
    });
    expect(result.items[0]).toEqual(auditEntry);
  });

  it("omits empty optional filters and rejects invalid external data", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          items: [],
          page: 1,
          pageSize: 25,
          totalCount: 0,
          totalPages: 0,
        },
      })
      .mockResolvedValueOnce({ data: { items: [{ id: "invalid" }] } });
    const filters = {
      action: "" as const,
      entity: "   ",
      fromUtc: "2030-05-12T08:00",
      page: 1,
      pageSize: 25,
      toUtc: "2030-06-10T08:00",
    };

    await searchAuditTrail(filters);
    expect(api.get).toHaveBeenNthCalledWith(1, "/audits", {
      params: expect.objectContaining({
        action: undefined,
        actorUserId: undefined,
        entity: undefined,
        recordId: undefined,
        systemOnly: undefined,
      }),
    });
    await expect(searchAuditTrail(filters)).rejects.toMatchObject({
      name: "AuditTrailContractError",
    });
  });
});
