import { api } from "../../../services/api";
import { dailyOperationalSummarySchema } from "../schemas/operationalSummarySchema";
import type { DailyOperationalSummary } from "../types";

export class OperationalSummaryContractError extends Error {
  constructor() {
    super(
      "The operational summary response does not match the expected contract.",
    );
    this.name = "OperationalSummaryContractError";
  }
}

export async function getDailyOperationalSummary(
  date?: string,
): Promise<DailyOperationalSummary> {
  const response = await api.get<unknown>("/operations/daily-summary", {
    params: { date: date || undefined },
  });
  const result = dailyOperationalSummarySchema.safeParse(response.data);
  if (!result.success) throw new OperationalSummaryContractError();
  return result.data;
}
