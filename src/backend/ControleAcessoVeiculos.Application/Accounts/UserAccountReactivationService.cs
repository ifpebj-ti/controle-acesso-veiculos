using ControleAcessoVeiculos.Application.Authentication;

namespace ControleAcessoVeiculos.Application.Accounts;

public interface IUserAccountReactivationStore
{
    Task<AdministrativeCredentialResetStoreResult> TryReactivateWithCredentialAsync(
        int userId, int actorUserId, string passwordHash, DateTime occurredAtUtc,
        DateTime expiresAtUtc, string reason, CancellationToken cancellationToken);
}

public sealed class UserAccountReactivationService(
    IUserAccountReactivationStore store,
    IPasswordHashService passwordHashService,
    ITemporaryCredentialGenerator temporaryCredentialGenerator,
    TemporaryCredentialPolicy policy,
    TimeProvider timeProvider)
{
    public async Task<AdministrativeCredentialResetResult> ReactivateAsync(
        int userId, int actorUserId, string? reason,
        CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string[]>();
        if (userId <= 0)
        {
            errors["user"] = ["A conta informada é inválida."];
        }
        if (actorUserId <= 0)
        {
            errors["actor"] = ["O Administrador autenticado é inválido."];
        }
        if (reason is null || !CredentialResetReasons.Supported.Contains(reason))
        {
            errors["reason"] = ["Informe um motivo pertencente ao catálogo de recuperação."];
        }
        if (errors.Count > 0)
        {
            return AdministrativeCredentialResetResult.Validation(errors);
        }
        if (userId == actorUserId)
        {
            return AdministrativeCredentialResetResult.SelfReset();
        }

        var credential = temporaryCredentialGenerator.Create();
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var expiresAt = now.Add(policy.Lifetime);
        var result = await store.TryReactivateWithCredentialAsync(
            userId, actorUserId, passwordHashService.Hash(credential), now,
            expiresAt, reason!, cancellationToken);
        return result.Status switch
        {
            AdministrativeCredentialResetStoreStatus.Success =>
                AdministrativeCredentialResetResult.Success(credential, expiresAt),
            AdministrativeCredentialResetStoreStatus.NotFound =>
                AdministrativeCredentialResetResult.NotFound(),
            AdministrativeCredentialResetStoreStatus.SelfReset =>
                AdministrativeCredentialResetResult.SelfReset(),
            AdministrativeCredentialResetStoreStatus.ExternalAuthentication =>
                AdministrativeCredentialResetResult.ExternalAuthentication(),
            AdministrativeCredentialResetStoreStatus.AlreadyActive =>
                new(AdministrativeCredentialResetStatus.AlreadyActive, null, null,
                    new Dictionary<string, string[]>()),
            _ => throw new ArgumentOutOfRangeException(nameof(result))
        };
    }
}
