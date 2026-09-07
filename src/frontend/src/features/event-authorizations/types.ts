export interface EventVehicleRule {
  id: number;
  vehicleType: string;
  quantity: number;
  plate: string | null;
  consumedQuantity: number;
  remainingQuantity: number;
}

export interface EventAuthorization {
  id: number;
  name: string;
  responsible: string;
  startsAtUtc: string;
  endsAtUtc: string;
  area: string;
  overnightAllowed: boolean;
  notes: string | null;
  active: boolean;
  createdById: number;
  createdAtUtc: string;
  updatedById: number | null;
  updatedAtUtc: string | null;
  vehicleRules: EventVehicleRule[];
}

export interface EventAuthorizationPage {
  items: EventAuthorization[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface EventVehicleRuleInput {
  vehicleType: string;
  quantity: number;
  plate: string | null;
}

export interface EventAuthorizationInput {
  name: string;
  responsible: string;
  startsAtUtc: string;
  endsAtUtc: string;
  area: string;
  overnightAllowed: boolean;
  vehicleRules: EventVehicleRuleInput[];
  notes: string | null;
}

export interface EventAuthorizationFilters {
  fromUtc: string;
  toUtc: string;
  name: string;
  active: "true" | "false" | "all";
  page: number;
  pageSize: number;
}

export type EventAuthorizationServerErrors = Record<string, string>;
