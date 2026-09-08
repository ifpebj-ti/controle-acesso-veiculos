export interface GeneralAccessDailyTotals {
  entries: number;
  exits: number;
  openAtStart: number;
  openAtEnd: number;
}

export interface InstitutionalUsageDailyTotals {
  departures: number;
  returns: number;
  openAtStart: number;
  openAtEnd: number;
}

export interface EventAccessDailyTotals {
  entries: number;
  eventsWithEntries: number;
}

export interface DailyOperationalSummary {
  localDate: string;
  timeZoneId: string;
  periodStartUtc: string;
  periodEndUtcExclusive: string;
  generalAccess: GeneralAccessDailyTotals;
  institutionalUsages: InstitutionalUsageDailyTotals;
  eventAccess: EventAccessDailyTotals;
}
