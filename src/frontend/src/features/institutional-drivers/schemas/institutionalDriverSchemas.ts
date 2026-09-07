import { z } from "zod";

const optionalIdentifier = z.number().int().positive().nullable();

export const institutionalDriverSchema = z.object({
  id: z.number().int().positive(),
  personId: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  authorizedAtUtc: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value))),
  authorizedById: z.number().int().positive(),
  updatedAtUtc: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)))
    .nullable(),
  updatedById: optionalIdentifier,
});

export const institutionalDriverListSchema = z.array(institutionalDriverSchema);

export const institutionalDriverFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome do motorista.")
      .max(200, "O nome deve possuir até 200 caracteres."),
    documentType: z
      .string()
      .trim()
      .max(10, "O tipo do documento deve possuir até 10 caracteres."),
    documentNumber: z
      .string()
      .trim()
      .max(20, "O número do documento deve possuir até 20 caracteres."),
  })
  .superRefine((values, context) => {
    if (Boolean(values.documentType) !== Boolean(values.documentNumber)) {
      const field = values.documentType ? "documentNumber" : "documentType";
      context.addIssue({
        code: "custom",
        message: "Informe o tipo e o número do documento juntos.",
        path: [field],
      });
    }
  });

export type InstitutionalDriverFormValues = z.infer<
  typeof institutionalDriverFormSchema
>;
