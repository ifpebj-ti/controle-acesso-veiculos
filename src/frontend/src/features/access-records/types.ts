import type { z } from "zod";

import type {
  accessRecordSchema,
  pagedAccessRecordsSchema,
} from "./schemas/accessRecordSchemas";

export type AccessRecord = z.infer<typeof accessRecordSchema>;
export type PagedAccessRecords = z.infer<typeof pagedAccessRecordsSchema>;

export interface RegisterAccessEntryInput {
  plate: string;
  driverName: string;
  categoryName: string;
  objective: string;
  vehicleType?: string;
  observation?: string;
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
