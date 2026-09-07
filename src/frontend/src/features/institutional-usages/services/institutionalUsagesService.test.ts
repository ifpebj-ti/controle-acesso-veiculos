import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import {
  listOpenInstitutionalUsages,
  registerInstitutionalDeparture,
  registerInstitutionalReturn,
  searchInstitutionalUsageHistory,
} from "./institutionalUsagesService";

vi.mock("../../../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const usage = {
  createdById: 3,
  departureAtUtc: "2030-06-10T11:00:00Z",
  departureMileage: 12500,
  driverId: 8,
  driverName: "Motorista Fictício",
  id: 12,
  itinerary: "Campus — destino fictício",
  plate: "TST1A23",
  returnAtUtc: null,
  returnMileage: null,
  status: "EmUso",
  updatedById: null,
  vehicleId: 4,
  vehicleIdentification: "FROTA-TESTE-04",
};

describe("institutionalUsagesService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the documented operation and history endpoints", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: usage });
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [usage] })
      .mockResolvedValueOnce({
        data: {
          items: [usage],
          page: 1,
          pageSize: 25,
          totalCount: 1,
          totalPages: 1,
        },
      });
    const departure = {
      departureMileage: 12500,
      driverId: 8,
      itinerary: "Campus — destino fictício",
      vehicleId: 4,
    };

    await registerInstitutionalDeparture(departure);
    await listOpenInstitutionalUsages();
    await registerInstitutionalReturn(12, { returnMileage: 12540 });
    await searchInstitutionalUsageHistory({
      driverId: 8,
      fromUtc: "2030-06-01T00:00:00Z",
      page: 1,
      pageSize: 25,
      plate: " TST1A23 ",
      toUtc: "2030-06-30T23:59:00Z",
      vehicleId: 4,
      vehicleIdentification: " FROTA-TESTE-04 ",
    });

    expect(api.post).toHaveBeenNthCalledWith(
      1,
      "/institutional-vehicle-usages/departures",
      departure,
    );
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      "/institutional-vehicle-usages/open",
    );
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      "/institutional-vehicle-usages/12/returns",
      { returnMileage: 12540 },
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "/institutional-vehicle-usages/history",
      {
        params: {
          driverId: 8,
          from: "2030-06-01T00:00:00Z",
          page: 1,
          pageSize: 25,
          plate: "TST1A23",
          to: "2030-06-30T23:59:00Z",
          vehicleId: 4,
          vehicleIdentification: "FROTA-TESTE-04",
        },
      },
    );
  });

  it("omits empty optional filters and rejects invalid contracts", async () => {
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
      .mockResolvedValueOnce({ data: [{ id: "invalid" }] });

    await searchInstitutionalUsageHistory({
      fromUtc: "2030-06-01T00:00:00Z",
      page: 1,
      pageSize: 25,
      plate: "",
      toUtc: "2030-06-30T23:59:00Z",
      vehicleIdentification: "",
    });
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      "/institutional-vehicle-usages/history",
      {
        params: {
          driverId: undefined,
          from: "2030-06-01T00:00:00Z",
          page: 1,
          pageSize: 25,
          plate: undefined,
          to: "2030-06-30T23:59:00Z",
          vehicleId: undefined,
          vehicleIdentification: undefined,
        },
      },
    );
    await expect(listOpenInstitutionalUsages()).rejects.toMatchObject({
      name: "InstitutionalUsagesContractError",
    });
  });
});
