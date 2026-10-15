using ControleAcessoVeiculos.Application.AdministrativeReports;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class AdministrativeReportServiceTests
{
    private static readonly TimeZoneInfo InstitutionalTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("America/Recife");

    [Fact]
    public async Task VehicleMovementQueryUsesInstitutionalBoundariesAndAuditsConsultation()
    {
        var store = new FakeStore();
        var service = new AdministrativeReportService(store, InstitutionalTimeZone);

        var result = await service.SearchVehicleMovementsAsync(
            new(new DateOnly(2026, 10, 1), new DateOnly(2026, 10, 2), Plate: " abc "),
            7,
            TestContext.Current.CancellationToken);

        Assert.Equal(AdministrativeReportStatus.Success, result.Status);
        Assert.NotNull(store.Criteria);
        Assert.Equal("abc", store.Criteria.Plate);
        Assert.Equal(
            new DateTime(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc),
            store.Criteria.FromUtc);
        Assert.Equal(
            new DateTime(2026, 10, 3, 3, 0, 0, DateTimeKind.Utc),
            store.Criteria.ToExclusiveUtc);
        Assert.Equal((7, "VehicleMovements"), store.LastAudit);
    }

    [Theory]
    [InlineData("2026-10-02", "2026-10-01", 1, 25, "period")]
    [InlineData("2026-09-01", "2026-10-02", 1, 25, "period")]
    [InlineData("2026-10-01", "2026-10-01", 0, 25, "page")]
    [InlineData("2026-10-01", "2026-10-01", 1, 101, "pageSize")]
    public async Task InvalidVehicleMovementQueryIsRejectedWithoutStoreAccess(
        string from,
        string to,
        int page,
        int pageSize,
        string expectedError)
    {
        var store = new FakeStore();
        var service = new AdministrativeReportService(store, InstitutionalTimeZone);

        var result = await service.SearchVehicleMovementsAsync(
            new(DateOnly.Parse(from), DateOnly.Parse(to), Page: page, PageSize: pageSize),
            7,
            TestContext.Current.CancellationToken);

        Assert.Equal(AdministrativeReportStatus.Invalid, result.Status);
        Assert.Contains(expectedError, result.Errors.Keys);
        Assert.Null(store.Criteria);
        Assert.Null(store.LastAudit);
    }

    [Fact]
    public async Task InstitutionalFleetQueryAcceptsEmptyResultAndAuditsConsultation()
    {
        var store = new FakeStore();
        var service = new AdministrativeReportService(store, InstitutionalTimeZone);

        var result = await service.SearchInstitutionalFleetAsync(
            new(new DateOnly(2026, 10, 1), new DateOnly(2026, 10, 1)),
            9,
            TestContext.Current.CancellationToken);

        Assert.Equal(AdministrativeReportStatus.Success, result.Status);
        Assert.Empty(result.Report!.Items);
        Assert.Equal((9, "InstitutionalFleet"), store.LastAudit);
    }

    [Fact]
    public async Task UnknownStatusIsRejectedInsteadOfReturningAFalseEmptyReport()
    {
        var store = new FakeStore();
        var service = new AdministrativeReportService(store, InstitutionalTimeZone);

        var result = await service.SearchVehicleMovementsAsync(
            new(
                new DateOnly(2026, 10, 1),
                new DateOnly(2026, 10, 1),
                Status: "situacao-inexistente"),
            7,
            TestContext.Current.CancellationToken);

        Assert.Equal(AdministrativeReportStatus.Invalid, result.Status);
        Assert.Contains("status", result.Errors.Keys);
        Assert.Null(store.Criteria);
    }

    private sealed class FakeStore : IAdministrativeReportStore
    {
        public AdministrativeReportCriteria? Criteria { get; private set; }
        public (int ActorId, string ReportType)? LastAudit { get; private set; }

        public Task<PagedAdministrativeReport<VehicleMovementReportItem>>
            SearchVehicleMovementsAsync(
                AdministrativeReportCriteria criteria,
                string timeZoneId,
                CancellationToken cancellationToken)
        {
            Criteria = criteria;
            return Task.FromResult(new PagedAdministrativeReport<VehicleMovementReportItem>(
                [], criteria.Page, criteria.PageSize, 0, 0,
                criteria.From, criteria.To, timeZoneId));
        }

        public Task<PagedAdministrativeReport<InstitutionalFleetReportItem>>
            SearchInstitutionalFleetAsync(
                AdministrativeReportCriteria criteria,
                string timeZoneId,
                CancellationToken cancellationToken)
        {
            Criteria = criteria;
            return Task.FromResult(new PagedAdministrativeReport<InstitutionalFleetReportItem>(
                [], criteria.Page, criteria.PageSize, 0, 0,
                criteria.From, criteria.To, timeZoneId));
        }

        public Task RecordConsultationAsync(
            int actorUserId,
            string reportType,
            DateOnly from,
            DateOnly to,
            bool succeeded,
            CancellationToken cancellationToken)
        {
            LastAudit = (actorUserId, reportType);
            return Task.CompletedTask;
        }
    }
}
