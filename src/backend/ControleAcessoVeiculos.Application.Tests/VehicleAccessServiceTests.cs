using ControleAcessoVeiculos.Application.AccessRecords;

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
