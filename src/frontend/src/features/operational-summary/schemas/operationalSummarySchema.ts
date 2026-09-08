import { z } from "zod";

const nonnegativeInteger = z.number().int().nonnegative();
const validInstant = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)));

const movementTotalsSchema = z.object({
  openAtEnd: nonnegativeInteger,
  openAtStart: nonnegativeInteger,
});

export const dailyOperationalSummarySchema = z.object({
  eventAccess: z.object({
    entries: nonnegativeInteger,
    eventsWithEntries: nonnegativeInteger,
  }),
  generalAccess: movementTotalsSchema.extend({
    entries: nonnegativeInteger,
    exits: nonnegativeInteger,
  }),
  institutionalUsages: movementTotalsSchema.extend({
    departures: nonnegativeInteger,
    returns: nonnegativeInteger,
  }),
  localDate: z.iso.date(),
  periodEndUtcExclusive: validInstant,
  periodStartUtc: validInstant,
  timeZoneId: z.string().trim().min(1).max(100),
});
