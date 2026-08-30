using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.Authentication;

public sealed class LoginService(
    IAuthenticationUserStore userStore,
    IPasswordHashService passwordHashService,
    IAccessTokenService accessTokenService,
    TimeProvider timeProvider)
{
    public const int MaximumFailedAttempts = 5;
    public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public async Task<LoginResult> AuthenticateAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = Usuario.NormalizarEmail(email);
        var authenticationUser = await userStore.FindByEmailAsync(
            normalizedEmail,
            cancellationToken);
        var now = timeProvider.GetUtcNow().UtcDateTime;

        if (authenticationUser is null ||
            !authenticationUser.User.PodeAutenticar(now) ||
            !authenticationUser.ProfileIsActive)
        {
            passwordHashService.PerformDummyVerification(password);
            return LoginResult.InvalidCredentials();
        }

        if (!passwordHashService.Verify(authenticationUser.User.SenhaHash, password))
        {
            authenticationUser.User.RegistrarTentativaFalha(
                now,
                MaximumFailedAttempts,
                LockoutDuration);
            var audit = authenticationUser.User.BloqueadoAte > now
                ? new AuthenticationAudit(
                    authenticationUser.User.Id,
                    AuthenticationAuditOutcome.AccountLocked,
                    now,
                    authenticationUser.User.BloqueadoAte)
                : null;
            await userStore.SaveChangesAsync(audit, cancellationToken);
            return LoginResult.InvalidCredentials();
        }

        authenticationUser.User.RegistrarAutenticacaoBemSucedida(now);
        await userStore.SaveChangesAsync(
            new AuthenticationAudit(
                authenticationUser.User.Id,
                AuthenticationAuditOutcome.LoginSucceeded,
                now),
            cancellationToken);

        var token = accessTokenService.Issue(
            authenticationUser.User.Id,
            authenticationUser.User.Email,
            authenticationUser.ProfileName);

        return LoginResult.Success(token);
    }
}
