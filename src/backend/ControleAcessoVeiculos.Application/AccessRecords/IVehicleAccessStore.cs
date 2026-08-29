namespace ControleAcessoVeiculos.Application.AccessRecords;

public interface IVehicleAccessStore
{
    Task<VehicleAccessStoreRegistration> TryRegisterEntryAsync(
        VehicleEntryData entry,
        int actorUserId,
        DateTime entryAtUtc,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<VehicleAccessRecord>> ListOpenAsync(
        CancellationToken cancellationToken);

    Task<PagedVehicleAccessResult> SearchAsync(
        VehicleAccessSearchCriteria criteria,
        CancellationToken cancellationToken);

    Task<CloseVehicleAccessResult> TryCloseAsync(
        int accessRecordId,
        int actorUserId,
        DateTime exitAtUtc,
        CancellationToken cancellationToken);
}
