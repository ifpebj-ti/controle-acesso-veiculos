using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.Authentication;

public sealed class AuthenticationSessionStore(
    ControleAcessoVeiculosDbContext dbContext) : IAuthenticationSessionStore
{
    public void Add(SessaoAutenticacao session) =>
        dbContext.SessoesAutenticacao.Add(session);

    public async Task<AuthenticationSession?> FindByTokenHashForUpdateAsync(
        string tokenHash,
        CancellationToken cancellationToken)
    {
        var locator = await dbContext.SessoesAutenticacao
            .AsNoTracking()
            .Where(candidate => candidate.TokenHash == tokenHash)
            .Select(candidate => new { candidate.Id, candidate.UsuarioId })
            .SingleOrDefaultAsync(cancellationToken);

        if (locator is null)
        {
            return null;
        }

        var user = await dbContext.Usuarios
            .FromSqlInterpolated($"""
                SELECT *
                FROM dbo.usuarios
                WHERE id = {locator.UsuarioId}
                FOR UPDATE
                """)
            .SingleAsync(cancellationToken);
        var session = await dbContext.SessoesAutenticacao
            .FromSqlInterpolated($"""
                SELECT *
                FROM dbo.sessoes_autenticacao
                WHERE id = {locator.Id}
                FOR UPDATE
                """)
            .SingleAsync(cancellationToken);
        var profile = await dbContext.Perfis
            .Where(candidate => candidate.Id == user.PerfilId)
            .Select(candidate => new { candidate.Nome, candidate.Ativo })
            .SingleAsync(cancellationToken);

        return new AuthenticationSession(
            session,
            user,
            profile.Nome,
            profile.Ativo);
    }

    public async Task<IReadOnlyList<SessaoAutenticacao>> FindFamilyForUpdateAsync(
        Guid familyId,
        CancellationToken cancellationToken) =>
        await dbContext.SessoesAutenticacao
            .FromSqlInterpolated($"""
                SELECT *
                FROM dbo.sessoes_autenticacao
                WHERE familia_id = {familyId}
                FOR UPDATE
                """)
            .ToListAsync(cancellationToken);

    public async Task<TResult> ExecuteInTransactionAsync<TResult>(
        Func<CancellationToken, Task<TResult>> operation,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database
            .BeginTransactionAsync(cancellationToken);
        var result = await operation(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return result;
    }
}
