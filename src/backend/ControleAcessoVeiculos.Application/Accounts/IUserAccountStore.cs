namespace ControleAcessoVeiculos.Application.Accounts;

public interface IUserAccountStore
{
    Task<bool> HasAnyUserAsync(CancellationToken cancellationToken);

    Task<CreatedUserAccount?> TryCreateAsync(
        string name,
        string normalizedEmail,
        string passwordHash,
        string profileName,
        CancellationToken cancellationToken);
}

public sealed record CreatedUserAccount(int UserId, string Email, string ProfileName);
