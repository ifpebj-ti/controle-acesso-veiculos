import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import { getDailyOperationalSummary } from "./operationalSummaryService";

vi.mock("../../../services/api", () => ({
  api: { get: vi.fn() },
}));

const summary = {
  accessCategories: [
    { count: 5, label: "Visitante" },
    { count: 3, label: "Entrega" },
  ],
  eventAccess: { entries: 2, eventsWithEntries: 1 },
  generalAccess: { entries: 8, exits: 5, openAtEnd: 4, openAtStart: 1 },
  hourlyAccess: Array.from({ length: 24 }, (_, hour) => ({
    entries: hour === 8 ? 3 : 0,
    exits: hour === 17 ? 2 : 0,
    hour,
  })),
  institutionalUsages: {
    departures: 3,
    openAtEnd: 2,
    openAtStart: 1,
    returns: 2,
  },
  localDate: "2030-06-10",
  periodEndUtcExclusive: "2030-06-11T03:00:00Z",
  periodStartUtc: "2030-06-10T03:00:00Z",
  recentDailyAccess: Array.from({ length: 14 }, (_, index) => ({
    entries: index,
    exits: Math.max(0, index - 1),
    localDate: `2030-05-${String(index + 28).padStart(2, "0")}`,
  })).map((item, index) =>
    index < 4
      ? item
      : {
          ...item,
          localDate: `2030-06-${String(index - 3).padStart(2, "0")}`,
        },
  ),
  timeZoneId: "America/Recife",
  vehicleTypes: [
    { count: 6, label: "Automóvel" },
    { count: 2, label: "Motocicleta" },
  ],
};

describe("operationalSummaryService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests the daily summary with an optional local date", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summary });

    await expect(getDailyOperationalSummary("2030-06-10")).resolves.toEqual(
      summary,
    );
    expect(api.get).toHaveBeenCalledWith("/operations/daily-summary", {
      params: { date: "2030-06-10" },
    });
  });

  it("lets the API select its institutional current date", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summary });

    await getDailyOperationalSummary();

    expect(api.get).toHaveBeenCalledWith("/operations/daily-summary", {
      params: { date: undefined },
    });
  });

  it("rejects an invalid external contract", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { ...summary, generalAccess: { entries: -1 } },
    });

    await expect(getDailyOperationalSummary()).rejects.toMatchObject({
      name: "OperationalSummaryContractError",
    });
  });

  it("rejects the previous response shape without the real aggregates", async () => {
    const {
      accessCategories,
      hourlyAccess,
      recentDailyAccess,
      vehicleTypes,
      ...oldShape
    } = summary;
    void accessCategories;
    void hourlyAccess;
    void recentDailyAccess;
    void vehicleTypes;
    vi.mocked(api.get).mockResolvedValue({ data: oldShape });

    await expect(getDailyOperationalSummary()).rejects.toMatchObject({
      name: "OperationalSummaryContractError",
    });
  });
});
