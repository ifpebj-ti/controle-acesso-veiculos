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

    Task<IReadOnlyList<AccessEntryCandidate>> SearchEntryCandidatesAsync(
        AccessEntryCandidateSearchCriteria criteria,
        CancellationToken cancellationToken);

    Task<PagedVehicleAccessResult> SearchAsync(
        VehicleAccessSearchCriteria criteria,
        CancellationToken cancellationToken);

    Task<VehicleAccessCorrectionStoreResult> TryCorrectAsync(
        int accessRecordId,
        VehicleAccessCorrectionData correction,
        int actorUserId,
        DateTime correctedAtUtc,
        CancellationToken cancellationToken);

    Task<CloseVehicleAccessResult> TryCloseAsync(
        int accessRecordId,
        int actorUserId,
        DateTime exitAtUtc,
        CancellationToken cancellationToken);

    Task<CloseVehicleAccessResult> TryCloseExceptionallyAsync(
        int accessRecordId,
        ExceptionalVehicleAccessClosureData closure,
        int actorUserId,
        DateTime regularizedAtUtc,
        CancellationToken cancellationToken);
}
