import { z } from "zod";

const dateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)));
const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const reportActorSchema = z.object({
  userId: z.number().int().positive(),
  name: z.string().trim().min(1),
  profile: z.string().trim().min(1),
});

export const vehicleMovementReportItemSchema = z.object({
  id: z.number().int().positive(),
  entryAtUtc: dateTime,
  exitAtUtc: dateTime.nullable(),
  driverName: z.string().trim().min(1),
  vehicleType: z.string().nullable(),
  plate: z.string().nullable(),
  vehicleIdentification: z.string().nullable(),
  categoryName: z.string().trim().min(1),
  objective: z.string(),
  status: z.enum(["Aberto", "Encerrado", "Pendente"]),
  closureType: z.string().nullable(),
  eventName: z.string().nullable(),
  entryRecordedBy: reportActorSchema,
  exitRecordedBy: reportActorSchema.nullable(),
});

export const institutionalFleetReportItemSchema = z.object({
  id: z.number().int().positive(),
  plate: z.string().nullable(),
  vehicleIdentification: z.string().nullable(),
  driverName: z.string().trim().min(1),
  departureAtUtc: dateTime,
  departureMileage: z.number().int().nonnegative(),
  returnAtUtc: dateTime.nullable(),
  returnMileage: z.number().int().nonnegative().nullable(),
  distance: z.number().int().nonnegative().nullable(),
  itinerary: z.string().trim().min(1),
  status: z.enum(["EmUso", "Concluido", "PendenteRetorno", "Corrigido"]),
  departureRecordedBy: reportActorSchema,
  returnRecordedBy: reportActorSchema.nullable(),
});

function reportPageSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive().max(100),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    from: localDate,
    to: localDate,
    timeZoneId: z.string().trim().min(1),
  });
}

export const vehicleMovementReportPageSchema = reportPageSchema(
  vehicleMovementReportItemSchema,
);
export const institutionalFleetReportPageSchema = reportPageSchema(
  institutionalFleetReportItemSchema,
);
