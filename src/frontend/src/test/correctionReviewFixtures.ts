import type { AccessRecord } from "../features/access-records/types";
import type { CorrectionRequest } from "../features/access-corrections/schemas";

export const correctionKey = "c90b7d33-46fd-40bf-9cab-3230b650849f";
export const correctionAccess: AccessRecord = {
  id: 10,
  vehicleId: 3,
  personId: 2,
  plate: "DEM1A23",
  driverName: "Pessoa histórica fictícia",
  categoryName: "Visitante",
  objective: "Atendimento fictício",
  observation: null,
  entryAtUtc: "2026-09-02T12:00:00.000Z",
  exitAtUtc: null,
  status: "Aberto",
  createdById: 1,
  updatedById: null,
};
export const pendingCorrection: CorrectionRequest = {
  id: 31,
  accessRecordId: 10,
  plate: "DEM1A23",
  vehicleIdentification: null,
  driverName: "Pessoa histórica fictícia",
  requestKey: correctionKey,
  status: "Pendente",
  requestedByUserId: 1,
  requestedAtUtc: "2026-09-02T13:00:00Z",
  original: {
    categoryName: "Visitante",
    objective: "Atendimento fictício",
    observation: null,
  },
  proposed: {
    categoryName: "Entrega",
    objective: "Entrega fictícia conferida",
    observation: "Observação fictícia.",
  },
  justification: "Justificativa fictícia para revisão.",
  decidedByUserId: null,
  decidedAtUtc: null,
  decisionReason: null,
};
export function terminalCorrection(
  status: "Aprovada" | "Rejeitada" | "Cancelada" = "Aprovada",
): CorrectionRequest {
  return {
    ...pendingCorrection,
    status,
    decidedByUserId: status === "Cancelada" ? 1 : 2,
    decidedAtUtc: "2026-09-02T14:00:00Z",
    decisionReason: "Decisão fictícia após conferência.",
  };
}
