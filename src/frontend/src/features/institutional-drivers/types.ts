export interface InstitutionalDriver {
  id: number;
  personId: number;
  name: string;
  authorizedAtUtc: string;
  authorizedById: number;
  updatedAtUtc: string | null;
  updatedById: number | null;
}

export interface InstitutionalDriverInput {
  name: string;
  documentType: string | null;
  documentNumber: string | null;
}
