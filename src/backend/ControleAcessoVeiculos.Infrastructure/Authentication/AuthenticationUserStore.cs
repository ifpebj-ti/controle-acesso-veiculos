using System.Text.Json;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.Authentication;

public sealed class AuthenticationUserStore(
    ControleAcessoVeiculosDbContext dbContext,
    TimeProvider timeProvider)
    : IAuthenticationUserStore
{
    public async Task<AuthenticationUser?> FindByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Usuarios
            .FromSqlInterpolated($"""
                SELECT *
                FROM dbo.usuarios
                WHERE email = {normalizedEmail}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            return null;
        }

        var profile = await dbContext.Perfis
            .Where(candidate => candidate.Id == user.PerfilId)
            .Select(candidate => new { candidate.Nome, candidate.Ativo })
            .SingleAsync(cancellationToken);

        return new AuthenticationUser(user, profile.Nome, profile.Ativo);
    }

    public async Task<GoogleAuthenticationLookup> FindForGoogleAuthenticationAsync(
        string subject,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        var subjectMatch = await FindByGoogleSubjectForUpdateAsync(
            subject,
            cancellationToken);
        var emailMatch = await FindByEmailForUpdateAsync(
            normalizedEmail,
            cancellationToken);

        return new GoogleAuthenticationLookup(
            await AddProfileAsync(subjectMatch, cancellationToken),
            await AddProfileAsync(emailMatch, cancellationToken));
    }

    public Task<bool> IsAuthenticationStateValidAsync(
        int userId,
        int credentialVersion,
        CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        return dbContext.Usuarios
            .AsNoTracking()
            .Where(user =>
                user.Id == userId &&
                user.Ativo &&
                user.VersaoCredencial == credentialVersion &&
                (!user.TrocaSenhaObrigatoria ||
                 user.CredencialTemporariaExpiraEm > now))
            .Join(
                dbContext.Perfis.AsNoTracking().Where(profile => profile.Ativo),
                user => user.PerfilId,
                profile => profile.Id,
                (_, _) => true)
            .AnyAsync(cancellationToken);
    }

    public Task SaveChangesAsync(
        AuthenticationAudit? audit,
        CancellationToken cancellationToken)
    {
        if (audit is not null)
        {
            dbContext.Auditorias.Add(CreateAudit(audit));
        }

        return dbContext.SaveChangesAsync(cancellationToken);
    }

    private static Auditoria CreateAudit(AuthenticationAudit audit) =>
        new(
            audit.OccurredAtUtc,
            audit.Outcome == AuthenticationAuditOutcome.LogoutSucceeded
                ? TipoAcaoAuditoria.Logout
                : TipoAcaoAuditoria.Login,
            nameof(Usuario),
            audit.UserId,
            audit.UserId,
            dadosNovos: SerializeAuditState(audit),
            detalhes: audit.Outcome switch
            {
                AuthenticationAuditOutcome.LoginSucceeded =>
                    "Authentication succeeded.",
                AuthenticationAuditOutcome.AccountLocked =>
                    "Account temporarily locked after failed authentication attempts.",
                AuthenticationAuditOutcome.LogoutSucceeded =>
                    "Authentication session ended by the user.",
                AuthenticationAuditOutcome.TokenReuseDetected =>
                    "Authentication session revoked after refresh token reuse.",
                AuthenticationAuditOutcome.SessionRevoked =>
                    "Authentication session revoked because the account or profile is inactive.",
                _ => throw new ArgumentOutOfRangeException(nameof(audit))
            });

    private static string SerializeAuditState(AuthenticationAudit audit) =>
        audit.Outcome == AuthenticationAuditOutcome.AccountLocked
            ? JsonSerializer.Serialize(new
            {
                outcome = audit.Outcome.ToString(),
                lockedUntilUtc = audit.LockedUntilUtc
            })
            : audit.Provider is null && !audit.IdentityLinked
                ? JsonSerializer.Serialize(new
                {
                    outcome = audit.Outcome.ToString()
                })
            : JsonSerializer.Serialize(new
            {
                outcome = audit.Outcome.ToString(),
                provider = audit.Provider,
                identityLinked = audit.IdentityLinked
            });

    private async Task<Usuario?> FindByGoogleSubjectForUpdateAsync(
        string subject,
        CancellationToken cancellationToken) =>
        await dbContext.Usuarios
            .FromSqlInterpolated($"""
                SELECT *
                FROM dbo.usuarios
                WHERE google_subject = {subject}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(cancellationToken);

    private async Task<Usuario?> FindByEmailForUpdateAsync(
        string normalizedEmail,
        CancellationToken cancellationToken) =>
        await dbContext.Usuarios
            .FromSqlInterpolated($"""
                SELECT *
                FROM dbo.usuarios
                WHERE email = {normalizedEmail}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(cancellationToken);

    private async Task<AuthenticationUser?> AddProfileAsync(
        Usuario? user,
        CancellationToken cancellationToken)
    {
        if (user is null)
        {
            return null;
        }

        var profile = await dbContext.Perfis
            .Where(candidate => candidate.Id == user.PerfilId)
            .Select(candidate => new { candidate.Nome, candidate.Ativo })
            .SingleAsync(cancellationToken);

        return new AuthenticationUser(user, profile.Nome, profile.Ativo);
    }
}
