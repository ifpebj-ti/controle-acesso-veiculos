import { api } from "../../../services/api";
import {
  accessRecordListSchema,
  accessRecordSchema,
  pagedAccessRecordsSchema,
} from "../schemas/accessRecordSchemas";
import type {
  AccessHistoryFilters,
  AccessRecord,
  PagedAccessRecords,
  RegisterAccessEntryInput,
} from "../types";

export class AccessRecordsContractError extends Error {
  constructor() {
    super("The access records response does not match the expected contract.");
    this.name = "AccessRecordsContractError";
  }
}

function parseContract<T>(
  result: { success: true; data: T } | { success: false },
): T {
  if (!result.success) throw new AccessRecordsContractError();
  return result.data;
}

export async function registerAccessEntry(
  input: RegisterAccessEntryInput,
): Promise<AccessRecord> {
  const response = await api.post<unknown>("/access-records/entries", input);
  return parseContract(accessRecordSchema.safeParse(response.data));
}

export async function listOpenAccessRecords(): Promise<AccessRecord[]> {
  const response = await api.get<unknown>("/access-records/open");
  return parseContract(accessRecordListSchema.safeParse(response.data));
}

export async function closeAccessRecord(id: number): Promise<AccessRecord> {
  const response = await api.post<unknown>(`/access-records/${id}/exit`);
  return parseContract(accessRecordSchema.safeParse(response.data));
}

export async function searchAccessHistory(
  filters: AccessHistoryFilters,
): Promise<PagedAccessRecords> {
  const response = await api.get<unknown>("/access-records/history", {
    params: filters,
  });
  return parseContract(pagedAccessRecordsSchema.safeParse(response.data));
}
