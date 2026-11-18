import type {
  CampusDriver,
  RegisterCampusDriverInput,
} from "../schemas/campusDriverSchemas";
export const preregistrationClassifications = [
  "Aluno",
  "Terceirizado",
  "Federal",
] as const;
export type PreregistrationClassification =
  (typeof preregistrationClassifications)[number];
export const affiliationLabel = (value: string) =>
  value === "Federal" ? "Servidor federal" : value;
export type PreregistrationDraft = RegisterCampusDriverInput;
export type PreregistrationListItem = CampusDriver;
export interface PreregistrationSearchDraft {
  query: string;
  includeInactive: boolean;
}
export type PreregistrationCatalogStatus =
  "loading" | "ready" | "error" | "denied";
