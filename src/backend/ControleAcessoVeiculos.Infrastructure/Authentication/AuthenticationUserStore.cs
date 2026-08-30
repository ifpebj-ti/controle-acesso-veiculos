using System.Text.Json;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.Authentication;

public sealed class AuthenticationUserStore(ControleAcessoVeiculosDbContext dbContext)
    : IAuthenticationUserStore
{
    public async Task<AuthenticationUser?> FindByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Usuarios.SingleOrDefaultAsync(
            candidate => candidate.Email == normalizedEmail,
            cancellationToken);

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

    public Task<bool> IsActiveAsync(
        int userId,
        CancellationToken cancellationToken) =>
        dbContext.Usuarios
            .AsNoTracking()
            .Where(user => user.Id == userId && user.Ativo)
            .Join(
                dbContext.Perfis.AsNoTracking().Where(profile => profile.Ativo),
                user => user.PerfilId,
                profile => profile.Id,
                (_, _) => true)
            .AnyAsync(cancellationToken);

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
            TipoAcaoAuditoria.Login,
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
                _ => throw new ArgumentOutOfRangeException(nameof(audit))
            });

    private static string SerializeAuditState(AuthenticationAudit audit) =>
        audit.Outcome == AuthenticationAuditOutcome.AccountLocked
            ? JsonSerializer.Serialize(new
            {
                outcome = audit.Outcome.ToString(),
                lockedUntilUtc = audit.LockedUntilUtc
            })
            : JsonSerializer.Serialize(new
            {
                outcome = audit.Outcome.ToString()
            });
}
