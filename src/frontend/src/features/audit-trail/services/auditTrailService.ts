import { api } from "../../../services/api";
import { auditTrailPageSchema } from "../schemas/auditTrailSchemas";
import type { AuditTrailFilters, AuditTrailPage } from "../types";

export class AuditTrailContractError extends Error {
  constructor() {
    super("The audit trail response does not match the expected contract.");
    this.name = "AuditTrailContractError";
  }
}

export async function searchAuditTrail(
  filters: AuditTrailFilters,
): Promise<AuditTrailPage> {
  const response = await api.get<unknown>("/audits", {
    params: {
      action: filters.action || undefined,
      actorUserId: filters.actorUserId,
      entity: filters.entity.trim() || undefined,
      fromUtc: new Date(filters.fromUtc).toISOString(),
      page: filters.page,
      pageSize: filters.pageSize,
      recordId: filters.recordId,
      systemOnly: filters.systemOnly,
      toUtc: new Date(filters.toUtc).toISOString(),
    },
  });
  const result = auditTrailPageSchema.safeParse(response.data);
  if (!result.success) throw new AuditTrailContractError();
  return result.data;
}
