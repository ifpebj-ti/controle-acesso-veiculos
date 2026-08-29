using ControleAcessoVeiculos.Application.InstitutionalVehicleUsages;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class InstitutionalVehicleUsageServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 8, 29, 9, 15, 0, TimeSpan.Zero);

    [Fact]
    public async Task RegisterDepartureAsync_ShouldValidateBeforeCallingStore()
    {
        var store = new FakeStore();
        var service = new InstitutionalVehicleUsageService(
            store,
            new FixedTimeProvider(FixedNow));

        var result = await service.RegisterDepartureAsync(
            new RegisterInstitutionalVehicleDepartureCommand(0, 0, -1, ""),
            actorUserId: 7);

        Assert.Equal(RegisterInstitutionalVehicleDepartureStatus.Invalid, result.Status);
        Assert.Contains("vehicleId", result.Errors.Keys);
        Assert.Contains("driverId", result.Errors.Keys);
        Assert.Contains("departureMileage", result.Errors.Keys);
        Assert.Contains("itinerary", result.Errors.Keys);
        Assert.Equal(0, store.DepartureCalls);
    }

    [Fact]
    public async Task RegisterDepartureAsync_ShouldNormalizeItineraryAndUseServerTime()
    {
        var store = new FakeStore();
        var service = new InstitutionalVehicleUsageService(
            store,
            new FixedTimeProvider(FixedNow));

        var result = await service.RegisterDepartureAsync(
            new RegisterInstitutionalVehicleDepartureCommand(
                VehicleId: 10,
                DriverId: 11,
                DepartureMileage: 12500,
                Itinerary: "  Campus - Unidade rural  "),
            actorUserId: 7);

        Assert.Equal(RegisterInstitutionalVehicleDepartureStatus.Success, result.Status);
        Assert.Equal("Campus - Unidade rural", store.LastItinerary);
        Assert.Equal(FixedNow.UtcDateTime, store.LastOccurredAtUtc);
        Assert.Equal(7, store.LastActorUserId);
    }

    [Fact]
    public async Task RegisterReturnAsync_ShouldValidateBeforeCallingStore()
    {
        var store = new FakeStore();
        var service = new InstitutionalVehicleUsageService(
            store,
            new FixedTimeProvider(FixedNow));

        var result = await service.RegisterReturnAsync(
            usageId: 0,
            new RegisterInstitutionalVehicleReturnCommand(ReturnMileage: -1),
            actorUserId: 7);

        Assert.Equal(RegisterInstitutionalVehicleReturnStatus.Invalid, result.Status);
        Assert.Contains("usageId", result.Errors.Keys);
        Assert.Contains("returnMileage", result.Errors.Keys);
        Assert.Equal(0, store.ReturnCalls);
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakeStore : IInstitutionalVehicleUsageStore
    {
        public int DepartureCalls { get; private set; }
        public int ReturnCalls { get; private set; }
        public string? LastItinerary { get; private set; }
        public int LastActorUserId { get; private set; }
        public DateTime LastOccurredAtUtc { get; private set; }

        public Task<InstitutionalVehicleDepartureStoreResult> TryRegisterDepartureAsync(
            int vehicleId,
            int driverId,
            int departureMileage,
            string itinerary,
            int actorUserId,
            DateTime departureAtUtc,
            CancellationToken cancellationToken)
        {
            DepartureCalls++;
            LastItinerary = itinerary;
            LastActorUserId = actorUserId;
            LastOccurredAtUtc = departureAtUtc;

            return Task.FromResult(new InstitutionalVehicleDepartureStoreResult(
                InstitutionalVehicleDepartureStoreStatus.Success,
                CreateRecord(
                    vehicleId,
                    driverId,
                    departureMileage,
                    itinerary,
                    actorUserId,
                    departureAtUtc)));
        }

        public Task<IReadOnlyList<InstitutionalVehicleUsageRecord>> ListOpenAsync(
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<InstitutionalVehicleUsageRecord>>([]);

        public Task<InstitutionalVehicleReturnStoreResult> TryRegisterReturnAsync(
            int usageId,
            int returnMileage,
            int actorUserId,
            DateTime returnAtUtc,
            CancellationToken cancellationToken)
        {
            ReturnCalls++;
            return Task.FromResult(new InstitutionalVehicleReturnStoreResult(
                InstitutionalVehicleReturnStoreStatus.NotFound,
                null));
        }

        private static InstitutionalVehicleUsageRecord CreateRecord(
            int vehicleId,
            int driverId,
            int departureMileage,
            string itinerary,
            int actorUserId,
            DateTime departureAtUtc) =>
            new(
                1,
                vehicleId,
                "ABC1D23",
                null,
                driverId,
                "Motorista de Teste",
                departureAtUtc,
                departureMileage,
                itinerary,
                null,
                null,
                "EmUso",
                actorUserId,
                null);
    }
}
