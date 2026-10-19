import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import type {
  AdministrativeReportFilters,
  InstitutionalFleetStatus,
  VehicleMovementStatus,
} from "../types";
import {
  AdministrativeReportsContractError,
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

const pageMetadata = {
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
  from: "2026-10-01",
  to: "2026-10-15",
  timeZoneId: "America/Recife",
};

const actor = { userId: 1, name: "Pessoa", profile: "Porteiro" };
const movementItem = {
  id: 1,
  entryAtUtc: "2026-10-10T12:00:00Z",
  exitAtUtc: null,
  driverName: "Condutor",
  vehicleType: "Automóvel",
  plate: "ABC1D23",
  vehicleIdentification: null,
  categoryName: "Visitante",
  objective: "Atendimento",
  status: "Aberto",
  closureType: null,
  eventName: null,
  entryRecordedBy: actor,
  exitRecordedBy: null,
};
const fleetItem = {
  id: 2,
  plate: null,
  vehicleIdentification: "VAN-01",
  driverName: "Motorista",
  departureAtUtc: "2026-10-10T12:00:00Z",
  departureMileage: 100,
  returnAtUtc: null,
  returnMileage: null,
  distance: null,
  itinerary: "Campus",
  status: "EmUso",
  departureRecordedBy: actor,
  returnRecordedBy: null,
};

function pdfResponse(
  contentDisposition: string | null = 'attachment; filename="relatorio.pdf"',
) {
  return {
    data: new Blob(["pdf"], { type: "application/pdf" }),
    headers: {
      "content-disposition": contentDisposition,
      "content-type": "application/pdf; charset=binary",
    },
  };
}

describe("administrativeReportsService", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
  });

  it("uses only the documented filters for each real report", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { ...pageMetadata, items: [] },
    });

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

  it.each<VehicleMovementStatus>(["Aberto", "Encerrado", "Pendente"])(
    "accepts the documented movement status %s",
    async (status) => {
      vi.mocked(api.get).mockResolvedValue({
        data: { ...pageMetadata, items: [{ ...movementItem, status }] },
      });
      await expect(searchVehicleMovementReport(filters)).resolves.toMatchObject(
        {
          items: [{ status }],
        },
      );
    },
  );

  it.each<InstitutionalFleetStatus>([
    "EmUso",
    "Concluido",
    "PendenteRetorno",
    "Corrigido",
  ])("accepts the documented fleet status %s", async (status) => {
    vi.mocked(api.get).mockResolvedValue({
      data: { ...pageMetadata, items: [{ ...fleetItem, status }] },
    });
    await expect(
      searchInstitutionalFleetReport({ ...filters, status }),
    ).resolves.toMatchObject({ items: [{ status }] });
  });

  it.each([
    ["movement", searchVehicleMovementReport, movementItem],
    ["fleet", searchInstitutionalFleetReport, fleetItem],
  ])(
    "rejects an unknown %s status as a contract error",
    async (_, search, item) => {
      vi.mocked(api.get).mockResolvedValue({
        data: { ...pageMetadata, items: [{ ...item, status: "Desconhecido" }] },
      });
      await expect(search(filters)).rejects.toBeInstanceOf(
        AdministrativeReportsContractError,
      );
    },
  );

  it("sends the password only in the PDF body and omits pagination", async () => {
    vi.mocked(api.post).mockResolvedValue(pdfResponse());
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

  it("accepts a PDF Blob and the safe filename informed by the server", async () => {
    vi.mocked(api.post).mockResolvedValue(
      pdfResponse("attachment; filename*=UTF-8''relat%C3%B3rio-outubro.pdf"),
    );
    await expect(
      exportVehicleMovementReport(filters, "secret"),
    ).resolves.toMatchObject({ fileName: "relatório-outubro.pdf" });
  });

  it("uses a safe fallback when the server filename is missing or unsafe", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce(pdfResponse(null))
      .mockResolvedValueOnce(
        pdfResponse('attachment; filename="../report.html"'),
      );

    await expect(
      exportVehicleMovementReport(filters, "secret"),
    ).resolves.toMatchObject({ fileName: "relatorio-movimentacoes.pdf" });
    await expect(
      exportInstitutionalFleetReport(filters, "secret"),
    ).resolves.toMatchObject({ fileName: "relatorio-frota.pdf" });
  });

  it("rejects HTTP 200 with an incompatible Content-Type", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: new Blob(["<html></html>"], { type: "text/html" }),
      headers: { "content-type": "text/html" },
    });
    await expect(
      exportVehicleMovementReport(filters, "secret"),
    ).rejects.toBeInstanceOf(AdministrativeReportsContractError);
  });

  it("rejects HTTP 200 that does not contain a Blob", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { message: "not a PDF" },
      headers: { "content-type": "application/pdf" },
    });
    await expect(
      exportVehicleMovementReport(filters, "secret"),
    ).rejects.toBeInstanceOf(AdministrativeReportsContractError);
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

  it.each([401, 429])(
    "propagates HTTP %s without repeating the POST",
    async (status) => {
      const error = { isAxiosError: true, response: { status, data: {} } };
      vi.mocked(api.post).mockRejectedValue(error);
      await expect(exportVehicleMovementReport(filters, "secret")).rejects.toBe(
        error,
      );
      expect(api.post).toHaveBeenCalledTimes(1);
    },
  );

  it("propagates a network failure without repeating the POST", async () => {
    const error = { isAxiosError: true, message: "Network Error" };
    vi.mocked(api.post).mockRejectedValue(error);
    await expect(exportVehicleMovementReport(filters, "secret")).rejects.toBe(
      error,
    );
    expect(api.post).toHaveBeenCalledTimes(1);
  });
});
