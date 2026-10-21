using System.Net.Mail;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Application.Authorization;

namespace ControleAcessoVeiculos.Application.Authentication;

public sealed class GoogleAuthenticationService(
    IAuthenticationUserStore userStore,
    IAccessTokenService accessTokenService,
    IRefreshTokenService refreshTokenService,
    IAuthenticationSessionStore sessionStore,
    AuthenticationSessionPolicy sessionPolicy,
    TimeProvider timeProvider)
{
    public Task<LoginResult> AuthenticateAsync(
        string? subject,
        string? email,
        bool emailVerified,
        CancellationToken cancellationToken = default)
    {
        if (!TryNormalizeIdentity(subject, email, emailVerified, out var identity))
        {
            return Task.FromResult(LoginResult.InvalidCredentials());
        }

        return sessionStore.ExecuteInTransactionAsync(
            transactionCancellationToken => AuthenticateInTransactionAsync(
                identity,
                transactionCancellationToken),
            cancellationToken);
    }

    private async Task<LoginResult> AuthenticateInTransactionAsync(
        GoogleIdentity identity,
        CancellationToken cancellationToken)
    {
        var lookup = await userStore.FindForGoogleAuthenticationAsync(
            identity.Subject,
            identity.Email,
            cancellationToken);

        if (lookup.SubjectMatch is not null &&
            lookup.EmailMatch is not null &&
            lookup.SubjectMatch.User.Id != lookup.EmailMatch.User.Id)
        {
            return LoginResult.InvalidCredentials();
        }

        var authenticationUser = lookup.SubjectMatch ?? lookup.EmailMatch;
        var now = timeProvider.GetUtcNow().UtcDateTime;
        if (authenticationUser is null ||
            !authenticationUser.User.PodeAutenticar(now) ||
            authenticationUser.ProfileName == ProfileNames.Administrator ||
            !authenticationUser.ProfileIsActive)
        {
            return LoginResult.InvalidCredentials();
        }

        var linkedNow = authenticationUser.User.GoogleSubject is null;
        if (linkedNow)
        {
            authenticationUser.User.VincularIdentidadeGoogle(identity.Subject, now);
            var existingSessions = await sessionStore.FindForUserForUpdateAsync(
                authenticationUser.User.Id,
                cancellationToken);
            foreach (var existingSession in existingSessions)
            {
                existingSession.Revogar(
                    now,
                    MotivoRevogacaoSessao.MetodoAutenticacaoAlterado);
            }
        }
        else if (!string.Equals(
                     authenticationUser.User.GoogleSubject,
                     identity.Subject,
                     StringComparison.Ordinal))
        {
            return LoginResult.InvalidCredentials();
        }

        authenticationUser.User.RegistrarAutenticacaoBemSucedida(now);
        var refreshToken = refreshTokenService.Create();
        var session = new SessaoAutenticacao(
            authenticationUser.User.Id,
            Guid.NewGuid(),
            refreshToken.Hash,
            now,
            now.Add(sessionPolicy.AbsoluteLifetime));
        sessionStore.Add(session);
        await userStore.SaveChangesAsync(
            new AuthenticationAudit(
                authenticationUser.User.Id,
                AuthenticationAuditOutcome.LoginSucceeded,
                now,
                Provider: "Google",
                IdentityLinked: linkedNow),
            cancellationToken);

        var token = accessTokenService.Issue(
            authenticationUser.User.Id,
            authenticationUser.User.Email,
            authenticationUser.ProfileName,
            authenticationUser.User.VersaoCredencial,
            requiresPasswordChange: false);

        return LoginResult.Success(
            token,
            refreshToken.Value,
            now,
            sessionPolicy.GetInactivityDeadline(
                session.UltimaAtividadeEm,
                session.ExpiraEm),
            session.ExpiraEm,
            new LoginUser(
                authenticationUser.User.Id,
                authenticationUser.User.Email,
                authenticationUser.ProfileName,
                RequiresPasswordChange: false));
    }

    private static bool TryNormalizeIdentity(
        string? subject,
        string? email,
        bool emailVerified,
        out GoogleIdentity identity)
    {
        identity = default!;
        if (!emailVerified || string.IsNullOrWhiteSpace(subject) || subject.Trim().Length > 255)
        {
            return false;
        }

        var candidateEmail = email?.Trim() ?? string.Empty;
        if (candidateEmail.Length > 254 ||
            !MailAddress.TryCreate(candidateEmail, out var parsedEmail) ||
            !string.Equals(
                parsedEmail.Address,
                candidateEmail,
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        identity = new GoogleIdentity(
            subject.Trim(),
            Usuario.NormalizarEmail(candidateEmail));
        return true;
    }

    private sealed record GoogleIdentity(string Subject, string Email);
}
