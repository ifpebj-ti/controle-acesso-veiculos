using ControleAcessoVeiculos.Application.OperationalSummaries;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class OperationalSummaryServiceTests
{
    private static readonly TimeZoneInfo InstitutionalTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("America/Recife");

    [Fact]
    public async Task ExplicitLocalDateUsesExclusiveUtcDayBoundaries()
    {
        var store = new FakeStore();
        var service = new OperationalSummaryService(
            store,
            new FixedTimeProvider(new DateTimeOffset(2026, 8, 30, 12, 0, 0, TimeSpan.Zero)),
            InstitutionalTimeZone);

        var result = await service.GetAsync(new DateOnly(2026, 8, 30), TestContext.Current.CancellationToken);

        Assert.Equal(new DateOnly(2026, 8, 30), result.LocalDate);
        Assert.Equal("America/Recife", result.TimeZoneId);
        Assert.Equal(new DateTime(2026, 8, 30, 3, 0, 0, DateTimeKind.Utc),
            result.PeriodStartUtc);
        Assert.Equal(new DateTime(2026, 8, 31, 3, 0, 0, DateTimeKind.Utc),
            result.PeriodEndUtcExclusive);
        Assert.Equal(store.Criteria?.PeriodStartUtc, result.PeriodStartUtc);
        Assert.Equal(store.Criteria?.PeriodEndUtcExclusive, result.PeriodEndUtcExclusive);
        Assert.Equal(
            new DateTime(2026, 8, 17, 3, 0, 0, DateTimeKind.Utc),
            store.Criteria?.TrendStartUtc);
        Assert.Same(store.Totals.GeneralAccess, result.GeneralAccess);
        Assert.Same(store.Totals.InstitutionalUsages, result.InstitutionalUsages);
        Assert.Same(store.Totals.EventAccess, result.EventAccess);
        Assert.Equal(24, result.HourlyAccess.Count);
        Assert.Equal(new HourlyAccessTotals(7, 1, 0), result.HourlyAccess[7]);
        Assert.Equal(new HourlyAccessTotals(9, 0, 1), result.HourlyAccess[9]);
        Assert.Equal(store.Totals.Aggregates.AccessCategories, result.AccessCategories);
        Assert.Equal(store.Totals.Aggregates.VehicleTypes, result.VehicleTypes);
        Assert.Equal(14, result.RecentDailyAccess.Count);
        Assert.Equal(
            new DailyAccessTotals(new DateOnly(2026, 8, 29), 1, 0),
            result.RecentDailyAccess[^2]);
        Assert.Equal(
            new DailyAccessTotals(new DateOnly(2026, 8, 30), 1, 1),
            result.RecentDailyAccess[^1]);
    }

    [Fact]
    public async Task MissingDateUsesCurrentInstitutionalDate()
    {
        var store = new FakeStore();
        var service = new OperationalSummaryService(
            store,
            new FixedTimeProvider(new DateTimeOffset(2026, 8, 31, 1, 30, 0, TimeSpan.Zero)),
            InstitutionalTimeZone);

        var result = await service.GetAsync(cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal(new DateOnly(2026, 8, 30), result.LocalDate);
    }

    private sealed class FakeStore : IOperationalSummaryStore
    {
        public OperationalSummaryCriteria? Criteria { get; private set; }

        public OperationalSummaryTotals Totals { get; } = new(
            new GeneralAccessDailyTotals(1, 2, 3, 4, 5),
            new InstitutionalUsageDailyTotals(5, 6, 7, 8),
            new EventAccessDailyTotals(9, 10),
            new OperationalAggregateSource(
                [new DateTime(2026, 8, 30, 10, 0, 0, DateTimeKind.Utc)],
                [new DateTime(2026, 8, 30, 12, 0, 0, DateTimeKind.Utc)],
                [
                    new DateTime(2026, 8, 29, 10, 0, 0, DateTimeKind.Utc),
                    new DateTime(2026, 8, 30, 10, 0, 0, DateTimeKind.Utc)
                ],
                [new DateTime(2026, 8, 30, 12, 0, 0, DateTimeKind.Utc)],
                [new NamedOperationalCount("Visitante", 1)],
                [new NamedOperationalCount("Automóvel", 1)]));

        public Task<OperationalSummaryTotals> GetAsync(
            OperationalSummaryCriteria criteria,
            CancellationToken cancellationToken)
        {
            Criteria = criteria;
            return Task.FromResult(Totals);
        }
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
