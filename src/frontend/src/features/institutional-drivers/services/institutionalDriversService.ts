import { api } from "../../../services/api";
import {
  institutionalDriverListSchema,
  institutionalDriverSchema,
} from "../schemas/institutionalDriverSchemas";
import type { InstitutionalDriver, InstitutionalDriverInput } from "../types";

export class InstitutionalDriversContractError extends Error {
  constructor() {
    super(
      "The institutional drivers response does not match the expected contract.",
    );
    this.name = "InstitutionalDriversContractError";
  }
}

function parseContract<T>(
  result: { success: true; data: T } | { success: false },
): T {
  if (!result.success) throw new InstitutionalDriversContractError();
  return result.data;
}

export async function listInstitutionalDrivers(): Promise<
  InstitutionalDriver[]
> {
  const response = await api.get<unknown>("/institutional-drivers");
  return parseContract(institutionalDriverListSchema.safeParse(response.data));
}

export async function authorizeInstitutionalDriver(
  input: InstitutionalDriverInput,
): Promise<InstitutionalDriver> {
  const response = await api.post<unknown>("/institutional-drivers", input);
  return parseContract(institutionalDriverSchema.safeParse(response.data));
}

export async function deactivateInstitutionalDriver(id: number): Promise<void> {
  await api.delete(`/institutional-drivers/${id}`);
}
