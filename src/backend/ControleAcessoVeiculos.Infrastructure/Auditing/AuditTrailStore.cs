using ControleAcessoVeiculos.Application.Auditing;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.Auditing;

public sealed class AuditTrailStore(ControleAcessoVeiculosDbContext dbContext)
    : IAuditTrailStore
{
    public async Task<PagedAuditTrailResult> SearchAsync(
        AuditTrailSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Auditorias
            .AsNoTracking()
            .Where(audit =>
                audit.DataHora >= criteria.FromUtc &&
                audit.DataHora < criteria.ToUtc);

        if (criteria.Action is { } action)
        {
            query = query.Where(audit => audit.TipoAcao == action);
        }

        if (criteria.Entity is not null)
        {
            query = query.Where(audit => EF.Functions.ILike(audit.Entidade, criteria.Entity));
        }

        if (criteria.RecordId is { } recordId)
        {
            query = query.Where(audit => audit.RegistroId == recordId);
        }

        if (criteria.ActorUserId is { } actorUserId)
        {
            query = query.Where(audit => audit.UsuarioId == actorUserId);
        }

        if (criteria.SystemOnly.HasValue)
        {
            query = criteria.SystemOnly.Value
                ? query.Where(audit => audit.UsuarioId == null)
                : query.Where(audit => audit.UsuarioId != null);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(audit => audit.DataHora)
            .ThenByDescending(audit => audit.Id)
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .Select(audit => new AuditTrailRecord(
                audit.Id,
                audit.DataHora,
                audit.TipoAcao.ToString(),
                audit.Entidade,
                audit.RegistroId,
                audit.UsuarioId,
                audit.Detalhes,
                audit.DadosAnteriores,
                audit.DadosNovos))
            .ToListAsync(cancellationToken);

        return new(
            items,
            criteria.Page,
            criteria.PageSize,
            totalCount,
            (int)Math.Ceiling(totalCount / (double)criteria.PageSize));
    }
}
