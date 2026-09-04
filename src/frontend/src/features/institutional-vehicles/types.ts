export interface InstitutionalVehicle {
  id: number;
  plate: string | null;
  identification: string | null;
  vehicleType: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  year: number | null;
  createdAtUtc: string;
}

export interface InstitutionalVehicleInput {
  plate: string | null;
  identification: string | null;
  vehicleType: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  year: number | null;
}
