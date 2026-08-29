using ControleAcessoVeiculos.Application.InstitutionalVehicles;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class InstitutionalVehicleCatalogServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 8, 29, 12, 30, 0, TimeSpan.Zero);

    [Fact]
    public async Task CreateAsync_ShouldValidateBeforeCallingStore()
    {
        var store = new FakeStore();
        var service = new InstitutionalVehicleCatalogService(
            store,
            new FixedTimeProvider(FixedNow));

        var result = await service.CreateAsync(
            new CreateInstitutionalVehicleCommand(
                Plate: "---",
                Identification: null,
                VehicleType: new string('x', 51),
                Year: 2028),
            actorUserId: 7);

        Assert.Equal(CreateInstitutionalVehicleStatus.Invalid, result.Status);
        Assert.Contains("plate", result.Errors.Keys);
        Assert.Contains("vehicleType", result.Errors.Keys);
        Assert.Contains("year", result.Errors.Keys);
        Assert.Equal(0, store.CreateCalls);
    }

    [Fact]
    public async Task CreateAsync_ShouldNormalizeDataAndUseServerTime()
    {
        var store = new FakeStore();
        var service = new InstitutionalVehicleCatalogService(
            store,
            new FixedTimeProvider(FixedNow));

        var result = await service.CreateAsync(
            new CreateInstitutionalVehicleCommand(
                Plate: " abc-1d23 ",
                Identification: " patrimônio 001 ",
                VehicleType: " Automóvel ",
                Brand: " Marca Fictícia "),
            actorUserId: 7);

        Assert.Equal(CreateInstitutionalVehicleStatus.Success, result.Status);
        Assert.Equal(1, store.CreateCalls);
        Assert.NotNull(store.LastVehicle);
        Assert.Equal("ABC1D23", store.LastVehicle.Plate);
        Assert.Equal("PATRIMÔNIO 001", store.LastVehicle.Identification);
        Assert.Equal("Automóvel", store.LastVehicle.VehicleType);
        Assert.Equal("Marca Fictícia", store.LastVehicle.Brand);
        Assert.Equal(7, store.LastActorUserId);
        Assert.Equal(FixedNow.UtcDateTime, store.LastCreatedAtUtc);
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakeStore : IInstitutionalVehicleCatalogStore
    {
        public int CreateCalls { get; private set; }
        public InstitutionalVehicleData? LastVehicle { get; private set; }
        public int LastActorUserId { get; private set; }
        public DateTime LastCreatedAtUtc { get; private set; }

        public Task<InstitutionalVehicleStoreRegistration> TryCreateAsync(
            InstitutionalVehicleData vehicle,
            int actorUserId,
            DateTime createdAtUtc,
            CancellationToken cancellationToken)
        {
            CreateCalls++;
            LastVehicle = vehicle;
            LastActorUserId = actorUserId;
            LastCreatedAtUtc = createdAtUtc;

            return Task.FromResult(new InstitutionalVehicleStoreRegistration(
                InstitutionalVehicleStoreRegistrationStatus.Success,
                new InstitutionalVehicleRecord(
                    1,
                    vehicle.Plate,
                    vehicle.Identification,
                    vehicle.VehicleType,
                    vehicle.Brand,
                    vehicle.Model,
                    vehicle.Color,
                    vehicle.Year,
                    createdAtUtc)));
        }

        public Task<IReadOnlyList<InstitutionalVehicleRecord>> ListActiveAsync(
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<InstitutionalVehicleRecord>>([]);
    }
}
