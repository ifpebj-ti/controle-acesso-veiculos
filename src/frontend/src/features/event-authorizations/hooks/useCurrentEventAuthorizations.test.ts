import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EventAuthorizationsContractError,
  searchEventAuthorizations,
} from "../services/eventAuthorizationsService";
import type { EventAuthorization, EventAuthorizationPage } from "../types";
import { useCurrentEventAuthorizations } from "./useCurrentEventAuthorizations";

vi.mock("../services/eventAuthorizationsService", async () => {
  const actual = await vi.importActual<
    typeof import("../services/eventAuthorizationsService")
  >("../services/eventAuthorizationsService");
  return { ...actual, searchEventAuthorizations: vi.fn() };
});

const currentEvent: EventAuthorization = {
  active: true,
  area: "Pátio Fictício",
  createdAtUtc: "2026-01-01T12:00:00Z",
  createdById: 1,
  endsAtUtc: "2100-01-01T00:00:00Z",
  id: 7,
  name: "Evento Atual Fictício",
  notes: null,
  overnightAllowed: false,
  responsible: "Setor Fictício",
  startsAtUtc: "2020-01-01T00:00:00Z",
  updatedAtUtc: null,
  updatedById: null,
  vehicleRules: [
    {
      consumedQuantity: 0,
      id: 9,
      plate: "EVT1A23",
      quantity: 1,
      remainingQuantity: 1,
      vehicleType: "AUTOMÓVEL",
    },
  ],
};

function page(items: EventAuthorization[]): EventAuthorizationPage {
  return {
    items,
    page: 1,
    pageSize: 100,
    totalCount: items.length,
    totalPages: items.length > 0 ? 1 : 0,
  };
}

describe("useCurrentEventAuthorizations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads active authorizations that are effective at request time", async () => {
    vi.mocked(searchEventAuthorizations).mockResolvedValue(
      page([
        currentEvent,
        { ...currentEvent, active: false, id: 8, name: "Evento Cancelado" },
        {
          ...currentEvent,
          endsAtUtc: "2021-01-01T00:00:00Z",
          id: 9,
          name: "Evento Encerrado",
        },
      ]),
    );

    const { result } = renderHook(() => useCurrentEventAuthorizations(true));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.events).toEqual([currentEvent]);
    expect(searchEventAuthorizations).toHaveBeenCalledWith(
      expect.objectContaining({ active: "true", page: 1, pageSize: 100 }),
    );
    const filters = vi.mocked(searchEventAuthorizations).mock.calls[0][0];
    expect(Date.parse(filters.fromUtc)).toBeLessThan(Date.parse(filters.toUtc));
  });

  it("loads every page of current authorizations", async () => {
    vi.mocked(searchEventAuthorizations)
      .mockResolvedValueOnce({
        ...page([currentEvent]),
        totalCount: 2,
        totalPages: 2,
      })
      .mockResolvedValueOnce(
        page([{ ...currentEvent, id: 8, name: "Segundo Evento Fictício" }]),
      );

    const { result } = renderHook(() => useCurrentEventAuthorizations(true));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.events).toHaveLength(2);
    expect(searchEventAuthorizations).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ page: 2, pageSize: 100 }),
    );
  });

  it("does not query before the progressive section is opened", () => {
    const { result } = renderHook(() => useCurrentEventAuthorizations(false));

    expect(result.current.status).toBe("idle");
    expect(searchEventAuthorizations).not.toHaveBeenCalled();
  });

  it("distinguishes an empty response and retries only the query", async () => {
    vi.mocked(searchEventAuthorizations)
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([currentEvent]));
    const { result } = renderHook(() => useCurrentEventAuthorizations(true));

    await waitFor(() => expect(result.current.status).toBe("empty"));
    await act(async () => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(searchEventAuthorizations).toHaveBeenCalledTimes(2);
  });

  it("keeps network and access-denied failures distinct without automatic retry", async () => {
    vi.mocked(searchEventAuthorizations).mockRejectedValueOnce(
      new Error("network"),
    );
    const network = renderHook(() => useCurrentEventAuthorizations(true));
    await waitFor(() => expect(network.result.current.status).toBe("error"));
    expect(searchEventAuthorizations).toHaveBeenCalledTimes(1);
    network.unmount();

    vi.mocked(searchEventAuthorizations).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: {}, status: 403 },
    });
    const denied = renderHook(() => useCurrentEventAuthorizations(true));
    await waitFor(() => expect(denied.result.current.status).toBe("denied"));
    expect(searchEventAuthorizations).toHaveBeenCalledTimes(2);
  });

  it("identifies a response contract failure", async () => {
    vi.mocked(searchEventAuthorizations).mockRejectedValue(
      new EventAuthorizationsContractError(),
    );
    const { result } = renderHook(() => useCurrentEventAuthorizations(true));

    await waitFor(() => expect(result.current.status).toBe("contract-error"));
    expect(result.current.errorMessage).toMatch(/resposta das autorizações/i);
  });
});
