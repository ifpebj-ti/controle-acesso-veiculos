import { z } from "zod";

const validDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)));

export const institutionalVehicleUsageSchema = z.object({
  id: z.number().int().positive(),
  vehicleId: z.number().int().positive(),
  plate: z.string().max(10).nullable(),
  vehicleIdentification: z.string().max(100).nullable(),
  driverId: z.number().int().positive(),
  driverName: z.string().trim().min(1).max(200),
  departureAtUtc: validDate,
  departureMileage: z.number().int().nonnegative(),
  itinerary: z.string().trim().min(1).max(500),
  returnAtUtc: validDate.nullable(),
  returnMileage: z.number().int().nonnegative().nullable(),
  status: z.enum(["EmUso", "Concluido"]),
  createdById: z.number().int().positive(),
  updatedById: z.number().int().positive().nullable(),
});

export const institutionalVehicleUsageListSchema = z.array(
  institutionalVehicleUsageSchema,
);

export const institutionalVehicleUsagePageSchema = z.object({
  items: z.array(institutionalVehicleUsageSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const institutionalDepartureFormSchema = z.object({
  vehicleId: z.coerce
    .number<number>()
    .int()
    .positive("Selecione um veículo institucional."),
  driverId: z.coerce
    .number<number>()
    .int()
    .positive("Selecione um motorista autorizado."),
  departureMileage: z.coerce
    .number<number>()
    .int("A quilometragem deve ser inteira.")
    .nonnegative("A quilometragem não pode ser negativa."),
  itinerary: z
    .string()
    .trim()
    .min(1, "Informe o itinerário.")
    .max(500, "O itinerário deve possuir até 500 caracteres."),
});

export function institutionalReturnFormSchema(departureMileage: number) {
  return z.object({
    returnMileage: z.coerce
      .number<number>()
      .int("A quilometragem deve ser inteira.")
      .min(
        departureMileage,
        "A quilometragem de retorno não pode ser inferior à de saída.",
      ),
  });
}

export type InstitutionalDepartureFormValues = z.infer<
  typeof institutionalDepartureFormSchema
>;

export type InstitutionalReturnFormValues = z.infer<
  ReturnType<typeof institutionalReturnFormSchema>
>;
