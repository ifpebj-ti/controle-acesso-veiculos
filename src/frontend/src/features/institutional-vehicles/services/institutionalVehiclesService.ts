import { api } from "../../../services/api";
import {
  institutionalVehicleListSchema,
  institutionalVehicleSchema,
} from "../schemas/institutionalVehicleSchemas";
import type { InstitutionalVehicle, InstitutionalVehicleInput } from "../types";

export class InstitutionalVehiclesContractError extends Error {
  constructor() {
    super(
      "The institutional vehicles response does not match the expected contract.",
    );
    this.name = "InstitutionalVehiclesContractError";
  }
}

function parseContract<T>(
  result: { success: true; data: T } | { success: false },
): T {
  if (!result.success) throw new InstitutionalVehiclesContractError();
  return result.data;
}

export async function listInstitutionalVehicles(): Promise<
  InstitutionalVehicle[]
> {
  const response = await api.get<unknown>("/institutional-vehicles");
  return parseContract(institutionalVehicleListSchema.safeParse(response.data));
}

export async function createInstitutionalVehicle(
  input: InstitutionalVehicleInput,
): Promise<InstitutionalVehicle> {
  const response = await api.post<unknown>("/institutional-vehicles", input);
  return parseContract(institutionalVehicleSchema.safeParse(response.data));
}

export async function updateInstitutionalVehicle(
  id: number,
  input: InstitutionalVehicleInput,
): Promise<InstitutionalVehicle> {
  const response = await api.put<unknown>(
    `/institutional-vehicles/${id}`,
    input,
  );
  return parseContract(institutionalVehicleSchema.safeParse(response.data));
}

export async function deactivateInstitutionalVehicle(
  id: number,
): Promise<void> {
  await api.delete(`/institutional-vehicles/${id}`);
}
