import { z } from "zod";

export const correctionStatuses = [
  "Pendente",
  "Aprovada",
  "Rejeitada",
  "Cancelada",
] as const;
const instant = z.string().refine((value) => !Number.isNaN(Date.parse(value)));
export const correctionValuesSchema = z
  .object({
    categoryName: z.string().min(1),
    objective: z.string().min(1).max(500),
    observation: z.string().max(1000).nullable(),
  })
  .strict();
export const correctionRequestSchema = z
  .object({
    id: z.number().int().positive(),
    accessRecordId: z.number().int().positive(),
    plate: z.string().nullable(),
    driverName: z.string(),
    vehicleIdentification: z.string().nullable(),
    requestKey: z.uuid(),
    status: z.enum(correctionStatuses),
    requestedByUserId: z.number().int().positive(),
    requestedAtUtc: instant,
    original: correctionValuesSchema,
    proposed: correctionValuesSchema,
    justification: z.string().min(10).max(500),
    decidedByUserId: z.number().int().positive().nullable(),
    decidedAtUtc: instant.nullable(),
    decisionReason: z.string().min(10).max(500).nullable(),
  })
  .strict()
  .refine((value) =>
    value.status === "Pendente"
      ? value.decidedByUserId === null &&
        value.decidedAtUtc === null &&
        value.decisionReason === null
      : value.decidedByUserId !== null &&
        value.decidedAtUtc !== null &&
        value.decisionReason !== null,
  );
export const correctionPageSchema = z
  .object({
    items: z.array(correctionRequestSchema),
    page: z.number().int().min(1).max(1000000),
    pageSize: z.number().int().min(1).max(100),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export const correctionReasonSchema = z
  .string()
  .trim()
  .min(10, "Informe um motivo de 10 a 500 caracteres.")
  .max(500, "Informe um motivo de 10 a 500 caracteres.");
export type CorrectionRequest = z.infer<typeof correctionRequestSchema>;
export type CorrectionPage = z.infer<typeof correctionPageSchema>;
export type CorrectionValues = z.infer<typeof correctionValuesSchema>;
export type CorrectionStatus = (typeof correctionStatuses)[number];
export type CorrectionAction = "Approve" | "Reject" | "Cancel";
export interface CorrectionSubmission {
  requestKey: string;
  original: CorrectionValues;
  proposed: CorrectionValues;
  justification: string;
}
