import { z } from "zod";

export const affiliationSchema = z.enum(["Aluno", "Terceirizado", "Federal"]);
export const campusDriverSchema = z
  .object({
    personId: z.number().int().positive(),
    vehicleId: z.number().int().positive(),
    name: z.string().trim().min(1),
    affiliation: affiliationSchema,
    plate: z.string().min(1),
    vehicleType: z.string().nullable(),
    active: z.boolean(),
    verifiedAtUtc: z.string().datetime({ offset: true }),
  })
  .strict();
export const campusDriverPageSchema = z
  .object({
    items: z.array(campusDriverSchema),
    totalCount: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(100),
  })
  .strict()
  .refine(
    (page) =>
      page.items.length <= page.pageSize &&
      page.items.length <= page.totalCount,
  );

export type CampusDriver = z.infer<typeof campusDriverSchema>;
export type CampusDriverPage = z.infer<typeof campusDriverPageSchema>;
export type CampusAffiliation = z.infer<typeof affiliationSchema>;

export interface RegisterCampusDriverInput {
  name: string;
  affiliation: CampusAffiliation;
  birthDate: string;
  birthDateConfirmed: boolean;
  plate: string;
  vehicleType: string;
  confirmPossibleDuplicate: boolean;
}
export interface AddCampusVehicleInput {
  plate: string;
  vehicleType: string;
}
export interface CampusDriverSearch {
  query: string;
  page: number;
  pageSize: number;
  includeInactive: boolean;
}

export const entrySuggestionSchema = z
  .object({
    vehicleId: z.number().int().positive(),
    personId: z.number().int().positive(),
    plate: z.string().min(1),
    driverName: z.string().min(1),
    vehicleType: z.string().nullable(),
    source: z.enum(["CampusRegistration", "SameDayVisit"]),
    affiliation: affiliationSchema.nullable(),
    previousObjective: z.string().nullable(),
    hasOpenAccess: z.boolean(),
    expiresAtUtc: z.string().datetime({ offset: true }).nullable(),
  })
  .strict()
  .refine((item) =>
    item.source === "SameDayVisit"
      ? item.expiresAtUtc !== null && item.affiliation === null
      : item.affiliation !== null && item.expiresAtUtc === null,
  );
export const entrySuggestionListSchema = z.array(entrySuggestionSchema).max(10);
export type EntrySuggestion = z.infer<typeof entrySuggestionSchema>;
