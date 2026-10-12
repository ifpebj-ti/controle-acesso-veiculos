namespace ControleAcessoVeiculos.Application.OperationalSummaries;

public sealed record OperationalSummaryCriteria(
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtcExclusive,
    DateTime TrendStartUtc);

public sealed record GeneralAccessDailyTotals(
    int Entries,
    int Exits,
    int ExceptionalClosures,
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

public sealed record NamedOperationalCount(
    string Label,
    int Count);

public sealed record HourlyAccessTotals(
    int Hour,
    int Entries,
    int Exits);

public sealed record DailyAccessTotals(
    DateOnly LocalDate,
    int Entries,
    int Exits);

public sealed record OperationalAggregateSource(
    IReadOnlyList<DateTime> SelectedDayEntryTimesUtc,
    IReadOnlyList<DateTime> SelectedDayExitTimesUtc,
    IReadOnlyList<DateTime> TrendEntryTimesUtc,
    IReadOnlyList<DateTime> TrendExitTimesUtc,
    IReadOnlyList<NamedOperationalCount> AccessCategories,
    IReadOnlyList<NamedOperationalCount> VehicleTypes);

public sealed record OperationalSummaryTotals(
    GeneralAccessDailyTotals GeneralAccess,
    InstitutionalUsageDailyTotals InstitutionalUsages,
    EventAccessDailyTotals EventAccess,
    OperationalAggregateSource Aggregates);

public sealed record DailyOperationalSummary(
    DateOnly LocalDate,
    string TimeZoneId,
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtcExclusive,
    GeneralAccessDailyTotals GeneralAccess,
    InstitutionalUsageDailyTotals InstitutionalUsages,
    EventAccessDailyTotals EventAccess,
    IReadOnlyList<HourlyAccessTotals> HourlyAccess,
    IReadOnlyList<NamedOperationalCount> AccessCategories,
    IReadOnlyList<NamedOperationalCount> VehicleTypes,
    IReadOnlyList<DailyAccessTotals> RecentDailyAccess);
