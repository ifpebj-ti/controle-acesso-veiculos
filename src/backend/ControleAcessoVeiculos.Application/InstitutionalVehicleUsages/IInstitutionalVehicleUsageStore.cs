namespace ControleAcessoVeiculos.Application.InstitutionalVehicleUsages;

public interface IInstitutionalVehicleUsageStore
{
    Task<InstitutionalVehicleDepartureStoreResult> TryRegisterDepartureAsync(
        int vehicleId,
        int driverId,
        int departureMileage,
        string itinerary,
        int actorUserId,
        DateTime departureAtUtc,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<InstitutionalVehicleUsageRecord>> ListOpenAsync(
        CancellationToken cancellationToken);

    Task<PagedInstitutionalVehicleUsageResult> SearchAsync(
        InstitutionalVehicleUsageSearchCriteria criteria,
        CancellationToken cancellationToken);

    Task<InstitutionalVehicleReturnStoreResult> TryRegisterReturnAsync(
        int usageId,
        int returnMileage,
        int actorUserId,
        DateTime returnAtUtc,
        CancellationToken cancellationToken);
}
