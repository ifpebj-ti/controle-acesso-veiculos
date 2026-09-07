import { z } from "zod";

const validDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)));

export const eventVehicleRuleSchema = z.object({
  id: z.number().int().positive(),
  vehicleType: z.string().trim().min(1).max(50),
  quantity: z.number().int().positive().max(1000),
  plate: z.string().max(10).nullable(),
  consumedQuantity: z.number().int().nonnegative(),
  remainingQuantity: z.number().int().nonnegative(),
});

export const eventAuthorizationSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  responsible: z.string().trim().min(1).max(200),
  startsAtUtc: validDate,
  endsAtUtc: validDate,
  area: z.string().trim().min(1).max(200),
  overnightAllowed: z.boolean(),
  notes: z.string().max(1000).nullable(),
  active: z.boolean(),
  createdById: z.number().int().positive(),
  createdAtUtc: validDate,
  updatedById: z.number().int().positive().nullable(),
  updatedAtUtc: validDate.nullable(),
  vehicleRules: z.array(eventVehicleRuleSchema).min(1).max(100),
});

export const eventAuthorizationPageSchema = z.object({
  items: z.array(eventAuthorizationSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

const eventVehicleRuleFormSchema = z.object({
  mode: z.enum(["quota", "plate"]),
  vehicleType: z
    .string()
    .trim()
    .min(1, "Informe o tipo do veículo.")
    .max(50, "O tipo deve possuir até 50 caracteres."),
  quantity: z.coerce
    .number<number>()
    .int("A quantidade deve ser inteira.")
    .min(1, "A quantidade mínima é 1.")
    .max(1000, "A quantidade máxima é 1000."),
  plate: z.string().trim().max(10, "A placa deve possuir até 10 caracteres."),
});

export const eventAuthorizationFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome do evento.")
      .max(200, "O nome deve possuir até 200 caracteres."),
    responsible: z
      .string()
      .trim()
      .min(1, "Informe a pessoa ou setor responsável.")
      .max(200, "O responsável deve possuir até 200 caracteres."),
    startsAtLocal: z.string().min(1, "Informe o início do evento."),
    endsAtLocal: z.string().min(1, "Informe o fim do evento."),
    area: z
      .string()
      .trim()
      .min(1, "Informe o local ou a área.")
      .max(200, "O local deve possuir até 200 caracteres."),
    overnightAllowed: z.boolean(),
    notes: z
      .string()
      .trim()
      .max(1000, "A observação deve possuir até 1000 caracteres."),
    vehicleRules: z
      .array(eventVehicleRuleFormSchema)
      .min(1, "Adicione ao menos uma regra de veículo.")
      .max(100, "Um evento pode possuir no máximo 100 regras."),
  })
  .superRefine((values, context) => {
    const startsAt = Date.parse(values.startsAtLocal);
    const endsAt = Date.parse(values.endsAtLocal);
    if (
      !Number.isNaN(startsAt) &&
      !Number.isNaN(endsAt) &&
      startsAt >= endsAt
    ) {
      context.addIssue({
        code: "custom",
        message: "O fim deve ocorrer depois do início.",
        path: ["endsAtLocal"],
      });
    }

    const plates = new Set<string>();
    const quotaTypes = new Set<string>();
    values.vehicleRules.forEach((rule, index) => {
      const normalizedType = rule.vehicleType.trim().toLocaleUpperCase("pt-BR");
      const normalizedPlate = rule.plate
        .replace(/[^\p{L}\p{N}]/gu, "")
        .toUpperCase();
      if (rule.mode === "plate") {
        if (!normalizedPlate) {
          context.addIssue({
            code: "custom",
            message: "Informe a placa específica.",
            path: ["vehicleRules", index, "plate"],
          });
        } else if (plates.has(normalizedPlate)) {
          context.addIssue({
            code: "custom",
            message: "A placa não pode ser repetida.",
            path: ["vehicleRules", index, "plate"],
          });
        }
        plates.add(normalizedPlate);
        if (rule.quantity !== 1) {
          context.addIssue({
            code: "custom",
            message: "Uma placa específica autoriza exatamente um veículo.",
            path: ["vehicleRules", index, "quantity"],
          });
        }
      } else {
        if (quotaTypes.has(normalizedType)) {
          context.addIssue({
            code: "custom",
            message: "A cota por tipo não pode ser repetida.",
            path: ["vehicleRules", index, "vehicleType"],
          });
        }
        quotaTypes.add(normalizedType);
      }
    });
  });

export type EventAuthorizationFormValues = z.infer<
  typeof eventAuthorizationFormSchema
>;
