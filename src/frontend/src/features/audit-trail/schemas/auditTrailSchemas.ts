import { z } from "zod";

import { auditActions, type JsonValue } from "../types";

const validInstant = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)));

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.boolean(),
    z.number(),
    z.string(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const auditEntrySchema = z.object({
  action: z.enum(auditActions),
  actorType: z.enum(["Human", "System"]),
  actorUserId: z.number().int().positive().nullable(),
  details: z.string().nullable(),
  entity: z.string().min(1).max(100),
  id: z.number().int().positive(),
  newState: jsonValueSchema.nullable(),
  occurredAtUtc: validInstant,
  previousState: jsonValueSchema.nullable(),
  recordId: z.number().int().positive(),
});

export const auditTrailPageSchema = z.object({
  items: z.array(auditEntrySchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
