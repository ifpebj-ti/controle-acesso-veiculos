import type { z } from "zod";

import type {
  accessEntryCandidateSchema,
  accessRecordSchema,
  pagedAccessRecordsSchema,
} from "./schemas/accessRecordSchemas";
import type { ExceptionalClosureReason } from "./model/exceptionalClosure";

export type AccessRecord = z.infer<typeof accessRecordSchema>;
export type AccessEntryCandidate = z.infer<typeof accessEntryCandidateSchema>;
export type PagedAccessRecords = z.infer<typeof pagedAccessRecordsSchema>;

interface RegisterAccessEntryFields {
  plate: string;
  driverName: string;
  categoryName: string;
  objective: string;
  vehicleType?: string;
  observation?: string;
  eventAuthorizationId?: number;
}

export type RegisterAccessEntryInput = RegisterAccessEntryFields &
  (
    | { vehicleId?: never; personId?: never }
    | { vehicleId: number; personId: number }
  );

export interface CorrectAccessRecordInput {
  objective: string;
  categoryName: string;
  observation: string | null;
  justification: string;
}

export interface ExceptionallyCloseAccessRecordInput {
  reason: ExceptionalClosureReason;
  observation: string;
  observedExitAtUtc: string | null;
}

export interface AccessHistoryFilters {
  plate?: string;
  driverName?: string;
  categoryName?: string;
  status?: "Aberto" | "Encerrado";
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}
