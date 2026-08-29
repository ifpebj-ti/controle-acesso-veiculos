namespace ControleAcessoVeiculos.Application.InstitutionalDrivers;

public interface IInstitutionalDriverStore
{
    Task<InstitutionalDriverStoreAuthorization> TryAuthorizeAsync(
        InstitutionalDriverData driver,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<InstitutionalDriverRecord>> ListActiveAsync(
        CancellationToken cancellationToken);

    Task<DeactivateInstitutionalDriverResult> TryDeactivateAsync(
        int driverId,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken);
}
