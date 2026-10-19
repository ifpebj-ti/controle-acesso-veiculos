import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import type { AdministrativeReportFilters } from "../types";
import {
  ReportExportReauthenticationError,
  exportInstitutionalFleetReport,
  exportVehicleMovementReport,
  searchInstitutionalFleetReport,
  searchVehicleMovementReport,
} from "./administrativeReportsService";

vi.mock("../../../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const filters: AdministrativeReportFilters = {
  from: "2026-10-01",
  to: "2026-10-15",
  plate: " abc ",
  driverName: " pessoa ",
  categoryName: " visitante ",
  vehicleIdentification: " van 01 ",
  status: "Aberto",
  page: 2,
  pageSize: 25,
};

const emptyPage = {
  items: [],
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 0,
  from: "2026-10-01",
  to: "2026-10-15",
  timeZoneId: "America/Recife",
};

describe("administrativeReportsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses only the documented filters for each real report", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: emptyPage });

    await searchVehicleMovementReport(filters);
    await searchInstitutionalFleetReport({ ...filters, status: "EmUso" });

    expect(api.get).toHaveBeenNthCalledWith(1, "/reports/vehicle-movements", {
      params: {
        from: filters.from,
        to: filters.to,
        plate: "abc",
        driverName: "pessoa",
        categoryName: "visitante",
        vehicleIdentification: undefined,
        status: "Aberto",
        page: 2,
        pageSize: 25,
      },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, "/reports/institutional-fleet", {
      params: expect.objectContaining({
        categoryName: undefined,
        vehicleIdentification: "van 01",
        status: "EmUso",
      }),
    });
  });

  it("rejects an invalid response instead of rendering invented data", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [{ id: "wrong" }] },
    });

    await expect(searchVehicleMovementReport(filters)).rejects.toMatchObject({
      name: "AdministrativeReportsContractError",
    });
  });

  it("sends the password only in the PDF body and omits pagination", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: new Blob(["pdf"], { type: "application/pdf" }),
      headers: { "content-disposition": 'attachment; filename="report.pdf"' },
    });

    await exportVehicleMovementReport(filters, "temporary-secret");
    await exportInstitutionalFleetReport(
      { ...filters, status: "Concluido" },
      "temporary-secret",
    );

    expect(api.post).toHaveBeenNthCalledWith(
      1,
      "/reports/vehicle-movements/pdf",
      expect.not.objectContaining({
        page: expect.anything(),
        pageSize: expect.anything(),
      }),
      { responseType: "blob", skipSessionRetry: true },
    );
    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({
      currentPassword: "temporary-secret",
      vehicleIdentification: undefined,
    });
    expect(vi.mocked(api.post).mock.calls[1][1]).toMatchObject({
      categoryName: undefined,
      currentPassword: "temporary-secret",
      vehicleIdentification: "van 01",
    });
  });

  it("identifies only the stable 403 reauthentication code", async () => {
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 403,
        data: new Blob(
          [JSON.stringify({ code: "report_export_reauthentication_failed" })],
          { type: "application/problem+json" },
        ),
      },
    });

    await expect(
      exportVehicleMovementReport(filters, "wrong-secret"),
    ).rejects.toBeInstanceOf(ReportExportReauthenticationError);
    expect(api.post).toHaveBeenCalledTimes(1);
  });
});
