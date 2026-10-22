import type {
  AdministrativeReportFilters,
  InstitutionalFleetStatus,
  ReportActor,
  VehicleMovementStatus,
} from "../types";

export const movementStatusOptions: ReadonlyArray<{
  label: string;
  value: "" | VehicleMovementStatus;
}> = [
  { label: "Todas", value: "" },
  { label: "Aberto", value: "Aberto" },
  { label: "Encerrado", value: "Encerrado" },
  { label: "Pendente", value: "Pendente" },
];

export const fleetStatusOptions: ReadonlyArray<{
  label: string;
  value: "" | InstitutionalFleetStatus;
}> = [
  { label: "Todas", value: "" },
  { label: "Em uso", value: "EmUso" },
  { label: "Concluído", value: "Concluido" },
  { label: "Pendente de retorno", value: "PendenteRetorno" },
  { label: "Corrigido", value: "Corrigido" },
];

export function currentLocalDate(offsetDays = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createInitialReportFilters(): AdministrativeReportFilters {
  return {
    from: currentLocalDate(-6),
    to: currentLocalDate(),
    plate: "",
    driverName: "",
    categoryName: "",
    vehicleIdentification: "",
    status: "",
    page: 1,
    pageSize: 25,
  };
}

export function validateReportPeriod(filters: AdministrativeReportFilters) {
  if (!filters.from || !filters.to) return "Informe as duas datas do período.";
  const from = Date.parse(`${filters.from}T00:00:00Z`);
  const to = Date.parse(`${filters.to}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) {
    return "A data final deve ser igual ou posterior à data inicial.";
  }
  if ((to - from) / 86_400_000 + 1 > 31) {
    return "O período máximo permitido é de 31 dias.";
  }
  return null;
}

export function formatReportDateTime(value: string | null, timeZone: string) {
  if (!value) return "Não registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function formatReportActor(actor: ReportActor | null) {
  return actor ? `${actor.name} (${actor.profile})` : "Não registrado";
}
