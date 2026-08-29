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
}
