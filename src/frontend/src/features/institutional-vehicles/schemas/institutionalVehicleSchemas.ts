import { z } from "zod";

const optionalText = (maximum: number, message: string) =>
  z.string().trim().max(maximum, message);

export const institutionalVehicleSchema = z.object({
  id: z.number().int().positive(),
  plate: z.string().nullable(),
  identification: z.string().nullable(),
  vehicleType: z.string().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  color: z.string().nullable(),
  year: z.number().int().positive().nullable(),
  createdAtUtc: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
});

export const institutionalVehicleListSchema = z.array(
  institutionalVehicleSchema,
);

export const institutionalVehicleFormSchema = z
  .object({
    plate: optionalText(10, "A placa deve possuir até 10 caracteres."),
    identification: optionalText(
      100,
      "A identificação deve possuir até 100 caracteres.",
    ),
    vehicleType: optionalText(
      50,
      "O tipo do veículo deve possuir até 50 caracteres.",
    ),
    brand: optionalText(80, "A marca deve possuir até 80 caracteres."),
    model: optionalText(100, "O modelo deve possuir até 100 caracteres."),
    color: optionalText(40, "A cor deve possuir até 40 caracteres."),
    year: z.string().trim(),
  })
  .superRefine((values, context) => {
    if (!values.plate && !values.identification) {
      context.addIssue({
        code: "custom",
        message: "Informe a placa ou a identificação do veículo.",
        path: ["identification"],
      });
    }

    if (values.plate && !/[\p{L}\p{N}]/u.test(values.plate)) {
      context.addIssue({
        code: "custom",
        message: "A placa deve conter letras ou números.",
        path: ["plate"],
      });
    }

    if (values.year) {
      const year = Number(values.year);
      if (
        !/^\d+$/.test(values.year) ||
        year <= 0 ||
        year > new Date().getFullYear() + 1
      ) {
        context.addIssue({
          code: "custom",
          message: "Informe um ano válido, no máximo o próximo ano.",
          path: ["year"],
        });
      }
    }
  });

export type InstitutionalVehicleFormValues = z.infer<
  typeof institutionalVehicleFormSchema
>;
