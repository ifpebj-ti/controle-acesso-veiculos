namespace ControleAcessoVeiculos.Application.Accounts;

public interface IUserAccountStore
{
    Task<bool> HasAnyUserAsync(CancellationToken cancellationToken);

    Task<CreatedUserAccount?> TryCreateAsync(
        string name,
        string normalizedEmail,
        string passwordHash,
        string profileName,
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
