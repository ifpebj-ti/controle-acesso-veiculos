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

export interface HourlyAccessTotals {
  hour: number;
  entries: number;
  exits: number;
}

export interface NamedOperationalCount {
  label: string;
  count: number;
}

export interface DailyAccessTotals {
  localDate: string;
  entries: number;
  exits: number;
}

export interface DailyOperationalSummary {
  localDate: string;
  timeZoneId: string;
  periodStartUtc: string;
  periodEndUtcExclusive: string;
  generalAccess: GeneralAccessDailyTotals;
  institutionalUsages: InstitutionalUsageDailyTotals;
  eventAccess: EventAccessDailyTotals;
  hourlyAccess: HourlyAccessTotals[];
  accessCategories: NamedOperationalCount[];
  vehicleTypes: NamedOperationalCount[];
  recentDailyAccess: DailyAccessTotals[];
}
