using System.Text.Json;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.Authentication;

public sealed class AuthenticatedPasswordChangeStore(
    ControleAcessoVeiculosDbContext dbContext) : IAuthenticatedPasswordChangeStore
{
    public Task<Usuario?> FindUserForUpdateAsync(
        int userId,
        CancellationToken cancellationToken) =>
        dbContext.Usuarios
            .FromSqlInterpolated(
                $"SELECT * FROM dbo.usuarios WHERE id = {userId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<SessaoAutenticacao>> FindSessionsForUpdateAsync(
        int userId,
        CancellationToken cancellationToken) =>
        await dbContext.SessoesAutenticacao
            .FromSqlInterpolated($"""
                SELECT *
                FROM dbo.sessoes_autenticacao
                WHERE usuario_id = {userId} AND revogada_em IS NULL
                FOR UPDATE
                """)
            .ToListAsync(cancellationToken);

    public Task SaveChangesAsync(
        AuthenticatedPasswordChangeAudit audit,
        CancellationToken cancellationToken)
    {
        dbContext.Auditorias.Add(new Auditoria(
            audit.OccurredAtUtc,
            TipoAcaoAuditoria.Alteracao,
            nameof(Usuario),
            audit.UserId,
            audit.UserId,
            dadosAnteriores: JsonSerializer.Serialize(new
            {
                credentialVersion = audit.PreviousCredentialVersion
            }),
            dadosNovos: JsonSerializer.Serialize(new
            {
                credentialVersion = audit.CurrentCredentialVersion
            }),
            detalhes: "User changed their authentication password."));

        return dbContext.SaveChangesAsync(cancellationToken);
    }

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
