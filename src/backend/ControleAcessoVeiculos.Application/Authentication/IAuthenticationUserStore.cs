namespace ControleAcessoVeiculos.Application.Authentication;

public interface IAuthenticationUserStore
{
    Task<AuthenticationUser?> FindByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(
        AuthenticationAudit? audit,
        CancellationToken cancellationToken);
}

public sealed record AuthenticationAudit(
    int UserId,
    AuthenticationAuditOutcome Outcome,
    DateTime OccurredAtUtc,
    DateTime? LockedUntilUtc = null);

public enum AuthenticationAuditOutcome
{
    LoginSucceeded = 1,
    AccountLocked = 2
}
