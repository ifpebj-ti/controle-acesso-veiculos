using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.Authentication;

public interface IAuthenticatedPasswordChangeStore
{
    Task<Usuario?> FindUserForUpdateAsync(
        int userId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<SessaoAutenticacao>> FindSessionsForUpdateAsync(
        int userId,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(
        AuthenticatedPasswordChangeAudit audit,
        CancellationToken cancellationToken);

    Task<TResult> ExecuteInTransactionAsync<TResult>(
        Func<CancellationToken, Task<TResult>> operation,
        CancellationToken cancellationToken);
}

public sealed record AuthenticatedPasswordChangeAudit(
    int UserId,
    int PreviousCredentialVersion,
    int CurrentCredentialVersion,
    DateTime OccurredAtUtc);
