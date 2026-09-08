import { api } from "../../../services/api";
import {
  institutionalVehicleUsageListSchema,
  institutionalVehicleUsagePageSchema,
  institutionalVehicleUsageSchema,
} from "../schemas/institutionalUsageSchemas";
import type {
  InstitutionalDepartureInput,
  InstitutionalReturnInput,
  InstitutionalUsageHistoryFilters,
  InstitutionalVehicleUsage,
  InstitutionalVehicleUsagePage,
} from "../types";

export class InstitutionalUsagesContractError extends Error {
  constructor() {
    super(
      "The institutional vehicle usages response does not match the expected contract.",
    );
    this.name = "InstitutionalUsagesContractError";
  }
}

function parseContract<T>(
  result: { success: true; data: T } | { success: false },
): T {
  if (!result.success) throw new InstitutionalUsagesContractError();
  return result.data;
}

export async function registerInstitutionalDeparture(
  input: InstitutionalDepartureInput,
): Promise<InstitutionalVehicleUsage> {
  const response = await api.post<unknown>(
    "/institutional-vehicle-usages/departures",
    input,
  );
  return parseContract(
    institutionalVehicleUsageSchema.safeParse(response.data),
  );
}

export async function listOpenInstitutionalUsages(): Promise<
  InstitutionalVehicleUsage[]
> {
  const response = await api.get<unknown>("/institutional-vehicle-usages/open");
  return parseContract(
    institutionalVehicleUsageListSchema.safeParse(response.data),
  );
}

export async function registerInstitutionalReturn(
  usageId: number,
  input: InstitutionalReturnInput,
): Promise<InstitutionalVehicleUsage> {
  const response = await api.post<unknown>(
    `/institutional-vehicle-usages/${usageId}/returns`,
    input,
  );
  return parseContract(
    institutionalVehicleUsageSchema.safeParse(response.data),
  );
}

export async function searchInstitutionalUsageHistory(
  filters: InstitutionalUsageHistoryFilters,
): Promise<InstitutionalVehicleUsagePage> {
  const response = await api.get<unknown>(
    "/institutional-vehicle-usages/history",
    {
      params: {
        driverId: filters.driverId,
        from: filters.fromUtc || undefined,
        page: filters.page,
        pageSize: filters.pageSize,
        plate: filters.plate.trim() || undefined,
        to: filters.toUtc || undefined,
        vehicleId: filters.vehicleId,
        vehicleIdentification:
          filters.vehicleIdentification.trim() || undefined,
      },
    },
  );
  return parseContract(
    institutionalVehicleUsagePageSchema.safeParse(response.data),
  );
}
