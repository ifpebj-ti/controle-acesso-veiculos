namespace ControleAcessoVeiculos.Application.OperationalSummaries;

public sealed record OperationalSummaryCriteria(
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtcExclusive);

public sealed record GeneralAccessDailyTotals(
    int Entries,
    int Exits,
    int OpenAtStart,
    int OpenAtEnd);

public sealed record InstitutionalUsageDailyTotals(
    int Departures,
    int Returns,
    int OpenAtStart,
    int OpenAtEnd);

public sealed record EventAccessDailyTotals(
    int Entries,
    int EventsWithEntries);

public sealed record OperationalSummaryTotals(
    GeneralAccessDailyTotals GeneralAccess,
    InstitutionalUsageDailyTotals InstitutionalUsages,
    EventAccessDailyTotals EventAccess);

public sealed record DailyOperationalSummary(
    DateOnly LocalDate,
    string TimeZoneId,
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtcExclusive,
    GeneralAccessDailyTotals GeneralAccess,
    InstitutionalUsageDailyTotals InstitutionalUsages,
    EventAccessDailyTotals EventAccess);
