using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Accounts;

public interface IAccountProfileStore
{
    Task<ChangeAccountProfileStoreResult> TryChangeProfileAsync(
        int userId,
        int actorUserId,
        string profileName,
        MetodoAutenticacao authenticationMethod,
        string? temporaryPasswordHash,
        DateTime? temporaryCredentialExpiresAtUtc,
        DateTime occurredAtUtc,
        string reason,
        CancellationToken cancellationToken);
}

public enum ChangeAccountProfileStoreStatus
{
    Success,
    NotFound,
    Inactive,
    SelfChange,
    ProfileNotFound,
    Conflict,
    LastAdministrator
}

public sealed record ChangeAccountProfileStoreResult(
    ChangeAccountProfileStoreStatus Status,
    string? PreviousProfileName = null,
    string? CurrentProfileName = null,
    MetodoAutenticacao? CurrentAuthenticationMethod = null);
