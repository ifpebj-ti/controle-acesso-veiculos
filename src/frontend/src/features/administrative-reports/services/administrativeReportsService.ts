import axios from "axios";

import { api } from "../../../services/api";
import {
  institutionalFleetReportPageSchema,
  vehicleMovementReportPageSchema,
} from "../schemas/administrativeReportSchemas";
import type {
  AdministrativeReportFilters,
  AdministrativeReportPage,
  ExportedReport,
  InstitutionalFleetReportItem,
  VehicleMovementReportItem,
} from "../types";

export class AdministrativeReportsContractError extends Error {
  constructor() {
    super("The administrative report response does not match the contract.");
    this.name = "AdministrativeReportsContractError";
  }
}

export class ReportExportReauthenticationError extends Error {
  constructor() {
    super("The report export confirmation failed.");
    this.name = "ReportExportReauthenticationError";
  }
}

function optional(value: string) {
  return value.trim() || undefined;
}

function queryParams(
  filters: AdministrativeReportFilters,
  kind: "movements" | "fleet",
) {
  return {
    from: filters.from,
    to: filters.to,
    plate: optional(filters.plate),
    driverName: optional(filters.driverName),
    categoryName:
      kind === "movements" ? optional(filters.categoryName) : undefined,
    vehicleIdentification:
      kind === "fleet" ? optional(filters.vehicleIdentification) : undefined,
    status: optional(filters.status),
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

function parseContract<T>(
  result: { success: true; data: T } | { success: false },
) {
  if (!result.success) throw new AdministrativeReportsContractError();
  return result.data;
}

export async function searchVehicleMovementReport(
  filters: AdministrativeReportFilters,
): Promise<AdministrativeReportPage<VehicleMovementReportItem>> {
  const response = await api.get<unknown>("/reports/vehicle-movements", {
    params: queryParams(filters, "movements"),
  });
  return parseContract(
    vehicleMovementReportPageSchema.safeParse(response.data),
  );
}

export async function searchInstitutionalFleetReport(
  filters: AdministrativeReportFilters,
): Promise<AdministrativeReportPage<InstitutionalFleetReportItem>> {
  const response = await api.get<unknown>("/reports/institutional-fleet", {
    params: queryParams(filters, "fleet"),
  });
  return parseContract(
    institutionalFleetReportPageSchema.safeParse(response.data),
  );
}

function exportBody(
  filters: AdministrativeReportFilters,
  currentPassword: string,
  kind: "movements" | "fleet",
) {
  return {
    from: filters.from,
    to: filters.to,
    plate: optional(filters.plate),
    driverName: optional(filters.driverName),
    categoryName:
      kind === "movements" ? optional(filters.categoryName) : undefined,
    vehicleIdentification:
      kind === "fleet" ? optional(filters.vehicleIdentification) : undefined,
    status: optional(filters.status),
    currentPassword,
  };
}

function fileNameFromHeader(header: unknown, fallback: string) {
  if (typeof header !== "string") return fallback;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return safePdfFileName(decodeURIComponent(encoded), fallback);
    } catch {
      return fallback;
    }
  }
  const fileName = header.match(/filename="?([^";]+)"?/i)?.[1];
  return fileName ? safePdfFileName(fileName, fallback) : fallback;
}

function safePdfFileName(value: string, fallback: string) {
  const safeName = Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .replace(/[\\/]/g, "-")
    .trim();
  if (!safeName || !safeName.toLowerCase().endsWith(".pdf")) return fallback;
  return safeName;
}

function isPdfContentType(value: unknown) {
  return (
    typeof value === "string" &&
    value.split(";", 1)[0].trim().toLowerCase() === "application/pdf"
  );
}

function validatePdfResponse(data: unknown, contentType: unknown) {
  if (
    !(data instanceof Blob) ||
    !isPdfContentType(contentType) ||
    (data.type !== "" && !isPdfContentType(data.type))
  ) {
    throw new AdministrativeReportsContractError();
  }
  return data;
}

async function hasReauthenticationCode(data: unknown) {
  try {
    const body =
      data instanceof Blob
        ? JSON.parse(await data.text())
        : typeof data === "object"
          ? data
          : null;
    return (
      body !== null &&
      "code" in body &&
      body.code === "report_export_reauthentication_failed"
    );
  } catch {
    return false;
  }
}

async function exportPdf(
  endpoint: string,
  filters: AdministrativeReportFilters,
  password: string,
  kind: "movements" | "fleet",
): Promise<ExportedReport> {
  try {
    const response = await api.post<Blob>(
      endpoint,
      exportBody(filters, password, kind),
      { responseType: "blob", skipSessionRetry: true },
    );
    const blob = validatePdfResponse(
      response.data,
      response.headers["content-type"],
    );
    return {
      blob,
      fileName: fileNameFromHeader(
        response.headers["content-disposition"],
        kind === "movements"
          ? "relatorio-movimentacoes.pdf"
          : "relatorio-frota.pdf",
      ),
    };
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 403 &&
      (await hasReauthenticationCode(error.response.data))
    ) {
      throw new ReportExportReauthenticationError();
    }
    throw error;
  }
}

export function exportVehicleMovementReport(
  filters: AdministrativeReportFilters,
  password: string,
) {
  return exportPdf(
    "/reports/vehicle-movements/pdf",
    filters,
    password,
    "movements",
  );
}

export function exportInstitutionalFleetReport(
  filters: AdministrativeReportFilters,
  password: string,
) {
  return exportPdf(
    "/reports/institutional-fleet/pdf",
    filters,
    password,
    "fleet",
  );
}
