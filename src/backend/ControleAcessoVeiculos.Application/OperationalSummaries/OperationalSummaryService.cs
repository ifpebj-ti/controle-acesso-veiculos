namespace ControleAcessoVeiculos.Application.OperationalSummaries;

public sealed class OperationalSummaryService(
    IOperationalSummaryStore store,
    TimeProvider timeProvider,
    TimeZoneInfo institutionalTimeZone)
{
    public async Task<DailyOperationalSummary> GetAsync(
        DateOnly? localDate = null,
        CancellationToken cancellationToken = default)
    {
        var selectedDate = localDate ?? CurrentLocalDate();
        var periodStartUtc = ConvertStartToUtc(selectedDate);
        var periodEndUtc = ConvertStartToUtc(selectedDate.AddDays(1));
        var totals = await store.GetAsync(
            new OperationalSummaryCriteria(periodStartUtc, periodEndUtc),
            cancellationToken);

        return new(
            selectedDate,
            institutionalTimeZone.Id,
            periodStartUtc,
            periodEndUtc,
            totals.GeneralAccess,
            totals.InstitutionalUsages,
            totals.EventAccess);
    }

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
