import { z } from "zod";

const nonnegativeInteger = z.number().int().nonnegative();
const validInstant = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)));

const movementTotalsSchema = z.object({
  openAtEnd: nonnegativeInteger,
  openAtStart: nonnegativeInteger,
});

const hourlyAccessSchema = z.object({
  entries: nonnegativeInteger,
  exits: nonnegativeInteger,
  hour: z.number().int().min(0).max(23),
});

const namedOperationalCountSchema = z.object({
  count: nonnegativeInteger,
  label: z.string().trim().min(1),
});

const dailyAccessSchema = z.object({
  entries: nonnegativeInteger,
  exits: nonnegativeInteger,
  localDate: z.iso.date(),
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
  accessCategories: z.array(namedOperationalCountSchema),
  hourlyAccess: z
    .array(hourlyAccessSchema)
    .length(24)
    .refine(
      (items) => items.every((item, index) => item.hour === index),
      "Hourly access must contain the ordered hours from 0 to 23.",
    ),
  localDate: z.iso.date(),
  periodEndUtcExclusive: validInstant,
  periodStartUtc: validInstant,
  recentDailyAccess: z.array(dailyAccessSchema).length(14),
  timeZoneId: z.string().trim().min(1).max(100),
  vehicleTypes: z.array(namedOperationalCountSchema),
});
