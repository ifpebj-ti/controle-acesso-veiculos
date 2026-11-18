import { api } from "../../../services/api";
import {
  campusDriverPageSchema,
  campusDriverSchema,
  entrySuggestionListSchema,
  type AddCampusVehicleInput,
  type CampusDriverSearch,
  type RegisterCampusDriverInput,
} from "../schemas/campusDriverSchemas";

export class CampusDriversContractError extends Error {
  constructor() {
    super("The campus driver response does not match its contract.");
    this.name = "CampusDriversContractError";
  }
}
function parse<T>(result: { success: true; data: T } | { success: false }) {
  if (!result.success) throw new CampusDriversContractError();
  return result.data;
}
export async function searchCampusDrivers(
  filters: CampusDriverSearch,
  signal?: AbortSignal,
) {
  const response = await api.get<unknown>("/campus-drivers", {
    params: { ...filters, query: filters.query.trim() || undefined },
    signal,
  });
  return parse(campusDriverPageSchema.safeParse(response.data));
}
export async function registerCampusDriver(input: RegisterCampusDriverInput) {
  const response = await api.post<unknown>("/campus-drivers", input, {
    skipSessionRetry: true,
  });
  if (response.status !== 201) throw new CampusDriversContractError();
  return parse(campusDriverSchema.safeParse(response.data));
}
export async function addCampusDriverVehicle(
  personId: number,
  input: AddCampusVehicleInput,
) {
  const response = await api.post<unknown>(
    `/campus-drivers/${personId}/vehicles`,
    input,
    { skipSessionRetry: true },
  );
  if (response.status !== 201) throw new CampusDriversContractError();
  return parse(campusDriverSchema.safeParse(response.data));
}
export async function deactivateCampusDriver(personId: number) {
  const response = await api.post(
    `/campus-drivers/${personId}/deactivate`,
    undefined,
    { skipSessionRetry: true },
  );
  if (response.status !== 204) throw new CampusDriversContractError();
}
export async function searchEntrySuggestions(
  query: string,
  signal?: AbortSignal,
) {
  const response = await api.get<unknown>("/access-records/entry-suggestions", {
    params: { query },
    signal,
  });
  return parse(entrySuggestionListSchema.safeParse(response.data));
}
