// Presentation models only; no HTTP contract exists for Issue #689 yet.
export const preregistrationClassifications = [
  "Aluno",
  "Terceirizado",
  "Federal",
] as const;

export type PreregistrationClassification =
  (typeof preregistrationClassifications)[number];

export interface PreregistrationDraft {
  name: string;
  classification: PreregistrationClassification;
}

export interface PreregistrationListItem extends PreregistrationDraft {
  // React rendering key, not a proposed backend identifier.
  key: string;
}

export interface PreregistrationSearchDraft {
  name: string;
  classification: string;
}

export type PreregistrationCatalogStatus =
  "loading" | "ready" | "error" | "denied";
