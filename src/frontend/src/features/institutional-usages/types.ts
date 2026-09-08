export interface InstitutionalVehicleUsage {
  id: number;
  vehicleId: number;
  plate: string | null;
  vehicleIdentification: string | null;
  driverId: number;
  driverName: string;
  departureAtUtc: string;
  departureMileage: number;
  itinerary: string;
  returnAtUtc: string | null;
  returnMileage: number | null;
  status: "EmUso" | "Concluido";
  createdById: number;
  updatedById: number | null;
}

export interface InstitutionalVehicleUsagePage {
  items: InstitutionalVehicleUsage[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface InstitutionalDepartureInput {
  vehicleId: number;
  driverId: number;
  departureMileage: number;
  itinerary: string;
}

export interface InstitutionalReturnInput {
  returnMileage: number;
}

export interface InstitutionalUsageHistoryFilters {
  vehicleId?: number;
  driverId?: number;
  plate: string;
  vehicleIdentification: string;
  fromUtc: string;
  toUtc: string;
  page: number;
  pageSize: number;
}

export type InstitutionalUsageServerErrors = Record<string, string>;

export type InstitutionalUsageHistoryFilterErrors = Partial<
  Record<
    "driverId" | "period" | "plate" | "vehicleId" | "vehicleIdentification",
    string
  >
>;
