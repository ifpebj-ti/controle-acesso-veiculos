using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class VehicleAccessServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 8, 28, 12, 30, 0, TimeSpan.Zero);

    [Fact]
    public async Task RegisterEntryAsync_ShouldValidateBeforeCallingStore()
    {
        var store = new FakeVehicleAccessStore();
        var service = new VehicleAccessService(store, new FixedTimeProvider(FixedNow));

        var result = await service.RegisterEntryAsync(
            new RegisterVehicleEntryCommand("", "---", "", "Desconhecida"),
            actorUserId: 7);

        Assert.Equal(RegisterVehicleEntryStatus.Invalid, result.Status);
        Assert.Contains("driverName", result.Errors.Keys);
        Assert.Contains("plate", result.Errors.Keys);
        Assert.Contains("objective", result.Errors.Keys);
        Assert.Contains("categoryName", result.Errors.Keys);
        Assert.Equal(0, store.RegisterCalls);
    }

    [Fact]
    public async Task RegisterEntryAsync_ShouldNormalizeDataAndUseServerTime()
    {
        var store = new FakeVehicleAccessStore();
        var service = new VehicleAccessService(store, new FixedTimeProvider(FixedNow));

        var result = await service.RegisterEntryAsync(
            new RegisterVehicleEntryCommand(
                "  Condutor de Teste  ",
                "abc-1d23",
                "  Visita técnica  ",
                "visitante",
                " cpf ",
                " 12345678900 "),
            actorUserId: 7);

        Assert.Equal(RegisterVehicleEntryStatus.Success, result.Status);
        Assert.Equal(1, store.RegisterCalls);
        Assert.NotNull(store.LastEntry);
        Assert.Equal("Condutor de Teste", store.LastEntry.DriverName);
        Assert.Equal("ABC1D23", store.LastEntry.Plate);
        Assert.Equal("Visitante", store.LastEntry.CategoryName);
        Assert.Equal("CPF", store.LastEntry.DocumentType);
        Assert.Equal(FixedNow.UtcDateTime, store.LastEntryAtUtc);
        Assert.Equal(7, store.LastActorUserId);
    }

    [Fact]
    public async Task SearchHistoryAsync_ShouldUseDefaultsAndNormalizeFilters()
    {
        var store = new FakeVehicleAccessStore();
        var service = new VehicleAccessService(store, new FixedTimeProvider(FixedNow));

        var result = await service.SearchHistoryAsync(new(
            Plate: "abc-1d23",
            DriverName: "  Condutor  ",
            CategoryName: "visitante",
            Status: "encerrado"));

        Assert.Equal(SearchVehicleAccessesStatus.Success, result.Status);
        Assert.NotNull(store.LastSearchCriteria);
        Assert.Equal("ABC1D23", store.LastSearchCriteria.Plate);
        Assert.Equal("Condutor", store.LastSearchCriteria.DriverName);
        Assert.Equal(AccessCategoryNames.Visitor, store.LastSearchCriteria.CategoryName);
        Assert.Equal(StatusRegistroAcesso.Encerrado,
            store.LastSearchCriteria.Status);
        Assert.Equal(FixedNow.AddDays(-30).UtcDateTime, store.LastSearchCriteria.FromUtc);
        Assert.Equal(FixedNow.UtcDateTime, store.LastSearchCriteria.ToUtc);
        Assert.Equal(1, store.LastSearchCriteria.Page);
        Assert.Equal(25, store.LastSearchCriteria.PageSize);
    }

    [Fact]
    public async Task SearchHistoryAsync_ShouldRejectInvalidFiltersBeforeCallingStore()
    {
        var store = new FakeVehicleAccessStore();
        var service = new VehicleAccessService(store, new FixedTimeProvider(FixedNow));

        var result = await service.SearchHistoryAsync(new(
            Plate: "---",
            DriverName: "x",
            CategoryName: "Desconhecida",
            Status: "999",
            From: FixedNow,
            To: FixedNow.AddDays(-1),
            Page: 0,
            PageSize: 101));

        Assert.Equal(SearchVehicleAccessesStatus.Invalid, result.Status);
        Assert.Null(store.LastSearchCriteria);
        Assert.Contains("plate", result.Errors.Keys);
        Assert.Contains("driverName", result.Errors.Keys);
        Assert.Contains("categoryName", result.Errors.Keys);
        Assert.Contains("status", result.Errors.Keys);
        Assert.Contains("period", result.Errors.Keys);
        Assert.Contains("page", result.Errors.Keys);
        Assert.Contains("pageSize", result.Errors.Keys);
    }

    [Fact]
    public async Task SearchHistoryAsync_ShouldRejectPeriodLongerThanOneYear()
    {
        var store = new FakeVehicleAccessStore();
        var service = new VehicleAccessService(store, new FixedTimeProvider(FixedNow));

        var result = await service.SearchHistoryAsync(new(
            From: FixedNow.AddDays(-367),
            To: FixedNow));

        Assert.Equal(SearchVehicleAccessesStatus.Invalid, result.Status);
        Assert.Contains("period", result.Errors.Keys);
        Assert.Null(store.LastSearchCriteria);
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakeVehicleAccessStore : IVehicleAccessStore
    {
        public int RegisterCalls { get; private set; }
        public VehicleEntryData? LastEntry { get; private set; }
        public int LastActorUserId { get; private set; }
        public DateTime LastEntryAtUtc { get; private set; }
        public VehicleAccessSearchCriteria? LastSearchCriteria { get; private set; }

        public Task<VehicleAccessStoreRegistration> TryRegisterEntryAsync(
            VehicleEntryData entry,
            int actorUserId,
            DateTime entryAtUtc,
            CancellationToken cancellationToken)
        {
            RegisterCalls++;
            LastEntry = entry;
            LastActorUserId = actorUserId;
            LastEntryAtUtc = entryAtUtc;

            return Task.FromResult(new VehicleAccessStoreRegistration(
                VehicleAccessStoreRegistrationStatus.Success,
                new VehicleAccessRecord(
                    1,
                    2,
                    entry.Plate,
                    3,
                    entry.DriverName,
                    entry.CategoryName,
                    entry.Objective,
                    entryAtUtc,
                    null,
                    "Aberto",
                    actorUserId,
                    null,
                    entry.Observation)));
        }

        public Task<IReadOnlyList<VehicleAccessRecord>> ListOpenAsync(
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<VehicleAccessRecord>>([]);

        public Task<PagedVehicleAccessResult> SearchAsync(
            VehicleAccessSearchCriteria criteria,
            CancellationToken cancellationToken)
        {
            LastSearchCriteria = criteria;
            return Task.FromResult(new PagedVehicleAccessResult([], criteria.Page,
                criteria.PageSize, 0, 0));
        }

        public Task<CloseVehicleAccessResult> TryCloseAsync(
            int accessRecordId,
            int actorUserId,
            DateTime exitAtUtc,
            CancellationToken cancellationToken) =>
            Task.FromResult(new CloseVehicleAccessResult(
                CloseVehicleAccessStatus.NotFound,
                null));
    }
}
