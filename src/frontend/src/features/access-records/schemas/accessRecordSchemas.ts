import { z } from "zod";

export const accessRecordSchema = z.object({
  id: z.number().int().positive(),
  vehicleId: z.number().int().positive(),
  plate: z.string(),
  personId: z.number().int().positive(),
  driverName: z.string(),
  categoryName: z.string(),
  objective: z.string(),
  entryAtUtc: z.string(),
  exitAtUtc: z.string().nullable(),
  status: z.string(),
  createdById: z.number().int().positive(),
  updatedById: z.number().int().positive().nullable(),
  observation: z.string().nullable(),
  eventAuthorizationId: z.number().int().positive().nullable().optional(),
  eventAuthorizationName: z.string().nullable().optional(),
  eventVehicleRuleId: z.number().int().positive().nullable().optional(),
});

export const accessRecordListSchema = z.array(accessRecordSchema);

export const pagedAccessRecordsSchema = z.object({
  items: accessRecordListSchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const accessEntryFormSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, "Informe a placa do veículo.")
    .max(10, "A placa deve possuir até 10 caracteres.")
    .regex(/[\p{L}\p{N}]/u, "A placa deve conter letras ou números."),
  driverName: z
    .string()
    .trim()
    .min(1, "Informe o nome do condutor.")
    .max(200, "O nome deve possuir até 200 caracteres."),
  categoryName: z.string().trim().min(1, "Selecione a categoria do acesso."),
  objective: z
    .string()
    .trim()
    .min(1, "Informe o objetivo do acesso.")
    .max(500, "O objetivo deve possuir até 500 caracteres."),
  vehicleType: z
    .string()
    .trim()
    .max(50, "O tipo do veículo deve possuir até 50 caracteres."),
  observation: z
    .string()
    .trim()
    .max(1000, "A observação deve possuir até 1000 caracteres."),
});

export type AccessEntryFormValues = z.infer<typeof accessEntryFormSchema>;
