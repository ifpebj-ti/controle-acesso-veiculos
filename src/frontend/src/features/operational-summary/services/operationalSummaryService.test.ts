import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import { getDailyOperationalSummary } from "./operationalSummaryService";

vi.mock("../../../services/api", () => ({
  api: { get: vi.fn() },
}));

const summary = {
  eventAccess: { entries: 2, eventsWithEntries: 1 },
  generalAccess: { entries: 8, exits: 5, openAtEnd: 4, openAtStart: 1 },
  institutionalUsages: {
    departures: 3,
    openAtEnd: 2,
    openAtStart: 1,
    returns: 2,
  },
  localDate: "2030-06-10",
  periodEndUtcExclusive: "2030-06-11T03:00:00Z",
  periodStartUtc: "2030-06-10T03:00:00Z",
  timeZoneId: "America/Recife",
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
});
