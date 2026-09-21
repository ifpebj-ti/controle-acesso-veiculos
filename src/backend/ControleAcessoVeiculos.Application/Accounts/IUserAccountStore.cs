namespace ControleAcessoVeiculos.Application.Accounts;

public interface IUserAccountStore
{
    Task<bool> HasAnyUserAsync(CancellationToken cancellationToken);

    Task<CreatedUserAccount?> TryCreateAsync(
        string name,
        string normalizedEmail,
        string passwordHash,
        string profileName,
        DateTime? temporaryCredentialExpiresAtUtc,
        AccountCreationAudit audit,
        CancellationToken cancellationToken);

    Task<PagedUserAccountResult> SearchAsync(
        UserAccountSearchCriteria criteria,
        CancellationToken cancellationToken);

    Task<UserAccountStoreStateStatus> TrySetActiveAsync(
        int userId,
        bool active,
        int actorUserId,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken);

    Task<AdministrativeCredentialResetStoreResult> TryResetCredentialAsync(
        int userId,
        int actorUserId,
        string passwordHash,
        DateTime occurredAtUtc,
        DateTime expiresAtUtc,
        string reason,
        CancellationToken cancellationToken);
}

public sealed record CreatedUserAccount(int UserId, string Email, string ProfileName);

public sealed record AccountCreationAudit(
    int? ActorUserId,
    DateTime OccurredAtUtc,
    AccountCreationOrigin Origin);

public enum AccountCreationOrigin
{
    Administration = 1,
    Bootstrap = 2
}

public enum AdministrativeCredentialResetStoreStatus
{
    Success = 1,
    NotFound = 2,
    Inactive = 3,
    SelfReset = 4
}

public sealed record AdministrativeCredentialResetStoreResult(
    AdministrativeCredentialResetStoreStatus Status,
    int? PreviousCredentialVersion = null,
    int? CurrentCredentialVersion = null);
