import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import {
  cancelEventAuthorization,
  createEventAuthorization,
  searchEventAuthorizations,
  updateEventAuthorization,
} from "./eventAuthorizationsService";

vi.mock("../../../services/api", () => ({
  api: { delete: vi.fn(), get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const event = {
  active: true,
  area: "Pátio de Teste",
  createdAtUtc: "2030-05-01T12:00:00Z",
  createdById: 1,
  endsAtUtc: "2030-05-10T20:00:00Z",
  id: 7,
  name: "Evento Fictício",
  notes: null,
  overnightAllowed: false,
  responsible: "Setor Fictício",
  startsAtUtc: "2030-05-10T12:00:00Z",
  updatedAtUtc: null,
  updatedById: null,
  vehicleRules: [
    {
      consumedQuantity: 1,
      id: 9,
      plate: null,
      quantity: 3,
      remainingQuantity: 2,
      vehicleType: "AUTOMÓVEL",
    },
  ],
};

const input = {
  area: event.area,
  endsAtUtc: event.endsAtUtc,
  name: event.name,
  notes: null,
  overnightAllowed: false,
  responsible: event.responsible,
  startsAtUtc: event.startsAtUtc,
  vehicleRules: [{ plate: null, quantity: 3, vehicleType: "Automóvel" }],
};

describe("eventAuthorizationsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the documented query and mutation endpoints", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [event],
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
      },
    });
    vi.mocked(api.post).mockResolvedValue({ data: event });
    vi.mocked(api.put).mockResolvedValue({ data: event });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });
    const filters = {
      active: "true" as const,
      fromUtc: "2030-05-01T00:00:00Z",
      name: " Evento ",
      page: 1,
      pageSize: 10,
      toUtc: "2030-06-01T00:00:00Z",
    };

    await searchEventAuthorizations(filters);
    await createEventAuthorization(input);
    await updateEventAuthorization(7, input);
    await cancelEventAuthorization(7);

    expect(api.get).toHaveBeenCalledWith("/event-authorizations", {
      params: {
        active: "true",
        fromUtc: filters.fromUtc,
        name: "Evento",
        page: 1,
        pageSize: 10,
        toUtc: filters.toUtc,
      },
    });
    expect(api.post).toHaveBeenCalledWith("/event-authorizations", input);
    expect(api.put).toHaveBeenCalledWith("/event-authorizations/7", input);
    expect(api.delete).toHaveBeenCalledWith("/event-authorizations/7");
  });

  it("omits optional query parameters and rejects invalid responses", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
    });
    await searchEventAuthorizations({
      active: "all",
      fromUtc: "",
      name: "",
      page: 1,
      pageSize: 10,
      toUtc: "",
    });
    expect(api.get).toHaveBeenCalledWith("/event-authorizations", {
      params: {
        active: undefined,
        fromUtc: undefined,
        name: undefined,
        page: 1,
        pageSize: 10,
        toUtc: undefined,
      },
    });

    vi.mocked(api.get).mockResolvedValueOnce({
      data: { items: [{ id: "invalid" }] },
    });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 7 } });
    await expect(
      searchEventAuthorizations({
        active: "true",
        fromUtc: "",
        name: "",
        page: 1,
        pageSize: 10,
        toUtc: "",
      }),
    ).rejects.toMatchObject({ name: "EventAuthorizationsContractError" });
    await expect(createEventAuthorization(input)).rejects.toMatchObject({
      name: "EventAuthorizationsContractError",
    });
  });
});
