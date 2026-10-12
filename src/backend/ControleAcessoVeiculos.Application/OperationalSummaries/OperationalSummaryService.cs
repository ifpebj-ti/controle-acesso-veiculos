namespace ControleAcessoVeiculos.Application.OperationalSummaries;

public sealed class OperationalSummaryService(
    IOperationalSummaryStore store,
    TimeProvider timeProvider,
    TimeZoneInfo institutionalTimeZone)
{
    private const int TrendDays = 14;

    public async Task<DailyOperationalSummary> GetAsync(
        DateOnly? localDate = null,
        CancellationToken cancellationToken = default)
    {
        var selectedDate = localDate ?? CurrentLocalDate();
        var periodStartUtc = ConvertStartToUtc(selectedDate);
        var periodEndUtc = ConvertStartToUtc(selectedDate.AddDays(1));
        var trendStartDate = selectedDate.AddDays(-(TrendDays - 1));
        var trendStartUtc = ConvertStartToUtc(trendStartDate);
        var totals = await store.GetAsync(
            new OperationalSummaryCriteria(
                periodStartUtc,
                periodEndUtc,
                trendStartUtc),
            cancellationToken);

        return new(
            selectedDate,
            institutionalTimeZone.Id,
            periodStartUtc,
            periodEndUtc,
            totals.GeneralAccess,
            totals.InstitutionalUsages,
            totals.EventAccess,
            BuildHourlyAccess(totals.Aggregates),
            totals.Aggregates.AccessCategories,
            totals.Aggregates.VehicleTypes,
            BuildDailyAccess(
                trendStartDate,
                selectedDate,
                totals.Aggregates));
    }

    private IReadOnlyList<HourlyAccessTotals> BuildHourlyAccess(
        OperationalAggregateSource source)
    {
        var entries = source.SelectedDayEntryTimesUtc
            .GroupBy(ToLocalHour)
            .ToDictionary(group => group.Key, group => group.Count());
        var exits = source.SelectedDayExitTimesUtc
            .GroupBy(ToLocalHour)
            .ToDictionary(group => group.Key, group => group.Count());

        return Enumerable.Range(0, 24)
            .Select(hour => new HourlyAccessTotals(
                hour,
                entries.GetValueOrDefault(hour),
                exits.GetValueOrDefault(hour)))
            .ToArray();
    }

    private IReadOnlyList<DailyAccessTotals> BuildDailyAccess(
        DateOnly startDate,
        DateOnly endDate,
        OperationalAggregateSource source)
    {
        var entries = source.TrendEntryTimesUtc
            .GroupBy(ToLocalDate)
            .ToDictionary(group => group.Key, group => group.Count());
        var exits = source.TrendExitTimesUtc
            .GroupBy(ToLocalDate)
            .ToDictionary(group => group.Key, group => group.Count());

        return Enumerable.Range(0, endDate.DayNumber - startDate.DayNumber + 1)
            .Select(offset => startDate.AddDays(offset))
            .Select(date => new DailyAccessTotals(
                date,
                entries.GetValueOrDefault(date),
                exits.GetValueOrDefault(date)))
            .ToArray();
    }

    private int ToLocalHour(DateTime utcDateTime) =>
        TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc),
            institutionalTimeZone).Hour;

    private DateOnly ToLocalDate(DateTime utcDateTime) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc),
            institutionalTimeZone));

    private DateOnly CurrentLocalDate()
    {
        var localNow = TimeZoneInfo.ConvertTime(
            timeProvider.GetUtcNow(),
            institutionalTimeZone);
        return DateOnly.FromDateTime(localNow.DateTime);
    }

    private DateTime ConvertStartToUtc(DateOnly date)
    {
        var localStart = DateTime.SpecifyKind(
            date.ToDateTime(TimeOnly.MinValue),
            DateTimeKind.Unspecified);

        if (institutionalTimeZone.IsInvalidTime(localStart))
        {
            throw new InvalidOperationException(
                $"O início do dia {date:yyyy-MM-dd} não existe no fuso institucional configurado.");
        }

        return TimeZoneInfo.ConvertTimeToUtc(localStart, institutionalTimeZone);
    }
}
