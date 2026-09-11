import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import {
  closeAccessRecord,
  correctAccessRecord,
  listOpenAccessRecords,
  registerAccessEntry,
  searchAccessHistory,
} from "./accessRecordsService";

vi.mock("../../../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const record = {
  categoryName: "Visitante",
  createdById: 1,
  driverName: "Pessoa fictícia",
  entryAtUtc: "2026-09-02T12:00:00.000Z",
  exitAtUtc: null,
  id: 10,
  objective: "Atendimento fictício",
  observation: null,
  personId: 2,
  plate: "DEM1A23",
  status: "Aberto",
  updatedById: null,
  vehicleId: 3,
};

describe("accessRecordsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the documented entry and exit endpoints", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: record });

    await registerAccessEntry({
      categoryName: "Visitante",
      driverName: "Pessoa fictícia",
      objective: "Atendimento fictício",
      plate: "DEM-1A23",
    });
    await closeAccessRecord(10);

    expect(api.post).toHaveBeenNthCalledWith(1, "/access-records/entries", {
      categoryName: "Visitante",
      driverName: "Pessoa fictícia",
      objective: "Atendimento fictício",
      plate: "DEM-1A23",
    });
    expect(api.post).toHaveBeenNthCalledWith(2, "/access-records/10/exit");
  });

  it("forwards an explicitly selected event authorization", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        ...record,
        eventAuthorizationId: 7,
        eventAuthorizationName: "Evento Fictício",
        eventVehicleRuleId: 9,
      },
    });

    const result = await registerAccessEntry({
      categoryName: "Visitante",
      driverName: "Pessoa fictícia",
      eventAuthorizationId: 7,
      objective: "Evento fictício",
      plate: "EVT-1A23",
      vehicleType: "Automóvel",
    });

    expect(api.post).toHaveBeenCalledWith("/access-records/entries", {
      categoryName: "Visitante",
      driverName: "Pessoa fictícia",
      eventAuthorizationId: 7,
      objective: "Evento fictício",
      plate: "EVT-1A23",
      vehicleType: "Automóvel",
    });
    expect(result.eventAuthorizationName).toBe("Evento Fictício");
  });

  it("uses the correction endpoint with only the supported fields", async () => {
    vi.mocked(api.put).mockResolvedValue({
      data: {
        ...record,
        categoryName: "Entrega",
        objective: "Entrega corrigida",
        observation: "Conferido na portaria",
        updatedById: 7,
      },
    });
    const input = {
      categoryName: "Entrega",
      justification: "Correção solicitada durante conferência.",
      objective: "Entrega corrigida",
      observation: "Conferido na portaria",
    };

    const result = await correctAccessRecord(10, input);

    expect(api.put).toHaveBeenCalledWith(
      "/access-records/10/correction",
      input,
    );
    expect(result).toMatchObject({
      categoryName: "Entrega",
      objective: "Entrega corrigida",
      updatedById: 7,
    });
  });

  it("rejects an invalid correction response", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { id: "invalid" } });

    await expect(
      correctAccessRecord(10, {
        categoryName: "Visitante",
        justification: "Justificativa fictícia válida.",
        objective: "Atendimento fictício",
        observation: null,
      }),
    ).rejects.toMatchObject({ name: "AccessRecordsContractError" });
  });

  it("passes only supported filters and pagination to history", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [record],
        page: 2,
        pageSize: 25,
        totalCount: 26,
        totalPages: 2,
      },
    });
    const filters = {
      categoryName: "Visitante",
      page: 2,
      pageSize: 25,
      plate: "DEM-1A23",
      status: "Aberto" as const,
    };

    const result = await searchAccessHistory(filters);

    expect(api.get).toHaveBeenCalledWith("/access-records/history", {
      params: filters,
    });
    expect(result.totalCount).toBe(26);
  });

  it("rejects an invalid response instead of presenting false data", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: "invalid" }] });

    await expect(listOpenAccessRecords()).rejects.toMatchObject({
      name: "AccessRecordsContractError",
    });
  });
});
