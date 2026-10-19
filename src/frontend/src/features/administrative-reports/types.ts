export type AdministrativeReportKind = "movements" | "fleet";

export type VehicleMovementStatus = "Aberto" | "Encerrado" | "Pendente";
export type InstitutionalFleetStatus =
  "EmUso" | "Concluido" | "PendenteRetorno" | "Corrigido";

export interface ReportActor {
  userId: number;
  name: string;
  profile: string;
}

export interface VehicleMovementReportItem {
  id: number;
  entryAtUtc: string;
  exitAtUtc: string | null;
  driverName: string;
  vehicleType: string | null;
  plate: string | null;
  vehicleIdentification: string | null;
  categoryName: string;
  objective: string;
  status: string;
  closureType: string | null;
  eventName: string | null;
  entryRecordedBy: ReportActor;
  exitRecordedBy: ReportActor | null;
}

export interface InstitutionalFleetReportItem {
  id: number;
  plate: string | null;
  vehicleIdentification: string | null;
  driverName: string;
  departureAtUtc: string;
  departureMileage: number;
  returnAtUtc: string | null;
  returnMileage: number | null;
  distance: number | null;
  itinerary: string;
  status: string;
  departureRecordedBy: ReportActor;
  returnRecordedBy: ReportActor | null;
}

export interface AdministrativeReportPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  from: string;
  to: string;
  timeZoneId: string;
}

export interface AdministrativeReportFilters {
  from: string;
  to: string;
  plate: string;
  driverName: string;
  categoryName: string;
  vehicleIdentification: string;
  status: string;
  page: number;
  pageSize: number;
}

export interface ExportedReport {
  blob: Blob;
  fileName: string;
}
