using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.Authentication;

public interface IAuthenticationSessionStore
{
    void Add(SessaoAutenticacao session);

    Task<AuthenticationSession?> FindByTokenHashForUpdateAsync(
        string tokenHash,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<SessaoAutenticacao>> FindFamilyForUpdateAsync(
        Guid familyId,
        CancellationToken cancellationToken);

    Task<TResult> ExecuteInTransactionAsync<TResult>(
        Func<CancellationToken, Task<TResult>> operation,
        CancellationToken cancellationToken);
}

public sealed record AuthenticationSession(
    SessaoAutenticacao Session,
    Usuario User,
    string ProfileName,
    bool ProfileIsActive);
