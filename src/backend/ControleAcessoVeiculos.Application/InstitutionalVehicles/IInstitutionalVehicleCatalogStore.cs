namespace ControleAcessoVeiculos.Application.InstitutionalVehicles;

public interface IInstitutionalVehicleCatalogStore
{
    Task<InstitutionalVehicleStoreRegistration> TryCreateAsync(
        InstitutionalVehicleData vehicle,
        int actorUserId,
        DateTime createdAtUtc,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<InstitutionalVehicleRecord>> ListActiveAsync(
        CancellationToken cancellationToken);

    Task<InstitutionalVehicleStoreUpdate> TryUpdateAsync(
        int vehicleId,
        InstitutionalVehicleData vehicle,
        int actorUserId,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken);

    Task<InstitutionalVehicleStoreStateStatus> TrySetActiveAsync(
        int vehicleId,
        bool active,
        int actorUserId,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken);
}
