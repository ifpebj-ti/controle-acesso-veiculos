using System.Text.Json;
using ControleAcessoVeiculos.Application.EventAuthorizations;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ControleAcessoVeiculos.Infrastructure.EventAuthorizations;

public sealed class EventAuthorizationStore(
    ControleAcessoVeiculosDbContext dbContext) : IEventAuthorizationStore
{
    public async Task<EventAuthorizationStoreResult> TryCreateAsync(
        EventAuthorizationData data,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        try
        {
            var entity = new EventoAcesso(
                data.Name,
                data.Responsible,
                data.StartsAtUtc,
                data.EndsAtUtc,
                data.Area,
                data.OvernightAllowed,
                data.Notes,
                actorUserId,
                occurredAtUtc);
            dbContext.EventosAcesso.Add(entity);
            await dbContext.SaveChangesAsync(cancellationToken);

            var rules = CreateRules(entity.Id, data.VehicleRules);
            dbContext.AutorizacoesVeiculosEventos.AddRange(rules);
            dbContext.Auditorias.Add(CreateAudit(
                entity,
                actorUserId,
                occurredAtUtc,
                TipoAcaoAuditoria.Inclusao,
                rules.Length,
                details: "Event authorization created."));

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new(
                EventAuthorizationStoreStatus.Success,
                Map(entity, rules));
        }
        catch (DbUpdateException exception) when (IsConstraintViolation(exception))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(EventAuthorizationStoreStatus.Conflict, null);
        }
    }

    public async Task<PagedEventAuthorizations> SearchAsync(
        EventAuthorizationSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        var query = dbContext.EventosAcesso
            .AsNoTracking()
            .Where(entity =>
                entity.Inicio < criteria.ToUtc &&
                entity.Fim >= criteria.FromUtc);

        if (criteria.Name is not null)
        {
            query = query.Where(entity =>
                EF.Functions.ILike(entity.Nome, $"%{criteria.Name}%"));
        }

        if (criteria.Active.HasValue)
        {
            query = query.Where(entity => entity.Ativo == criteria.Active.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var entities = await query
            .OrderBy(entity => entity.Inicio)
            .ThenBy(entity => entity.Id)
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync(cancellationToken);
        var rules = await LoadRulesAsync(
            entities.Select(entity => entity.Id).ToArray(),
            cancellationToken);
        var consumedQuantities = await LoadConsumedQuantitiesAsync(
            rules.Values.SelectMany(items => items).Select(rule => rule.Id).ToArray(),
            cancellationToken);

        return new(
            entities.Select(entity => Map(
                entity,
                rules.GetValueOrDefault(entity.Id, []),
                consumedQuantities)).ToArray(),
            criteria.Page,
            criteria.PageSize,
            totalCount,
            (int)Math.Ceiling(totalCount / (double)criteria.PageSize));
    }

    public async Task<EventAuthorizationStoreResult> TryUpdateAsync(
        int eventId,
        EventAuthorizationData data,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        try
        {
            var entity = await LockEventAsync(eventId, cancellationToken);
            if (entity is null)
            {
                return new(EventAuthorizationStoreStatus.NotFound, null);
            }

            if (!entity.Ativo)
            {
                return new(EventAuthorizationStoreStatus.Conflict, null);
            }

            var currentRules = await dbContext.AutorizacoesVeiculosEventos
                .Where(rule => rule.EventoAcessoId == eventId)
                .OrderBy(rule => rule.Id)
                .ToListAsync(cancellationToken);
            var consumedQuantities = await LoadConsumedQuantitiesAsync(
                currentRules.Select(rule => rule.Id).ToArray(),
                cancellationToken);
            var rulesChanged = !RulesMatch(currentRules, data.VehicleRules);

            if (rulesChanged && consumedQuantities.Values.Any(count => count > 0))
            {
                return new(EventAuthorizationStoreStatus.Conflict, null);
            }

            var eventChanged = entity.Atualizar(
                data.Name,
                data.Responsible,
                data.StartsAtUtc,
                data.EndsAtUtc,
                data.Area,
                data.OvernightAllowed,
                data.Notes,
                actorUserId,
                occurredAtUtc);

            if (!eventChanged && !rulesChanged)
            {
                return new(
                    EventAuthorizationStoreStatus.Success,
                    Map(entity, currentRules, consumedQuantities));
            }

            IReadOnlyList<AutorizacaoVeiculoEvento> resultingRules = currentRules;
            if (rulesChanged)
            {
                if (!eventChanged)
                {
                    entity.RegistrarAlteracao(actorUserId, occurredAtUtc);
                }

                dbContext.AutorizacoesVeiculosEventos.RemoveRange(currentRules);
                await dbContext.SaveChangesAsync(cancellationToken);
                resultingRules = CreateRules(eventId, data.VehicleRules);
                dbContext.AutorizacoesVeiculosEventos.AddRange(resultingRules);
            }

            dbContext.Auditorias.Add(new Auditoria(
                occurredAtUtc,
                TipoAcaoAuditoria.Alteracao,
                nameof(EventoAcesso),
                entity.Id,
                actorUserId,
                dadosAnteriores: JsonSerializer.Serialize(new
                {
                    vehicleRuleCount = currentRules.Count
                }),
                dadosNovos: JsonSerializer.Serialize(new
                {
                    active = entity.Ativo,
                    startsAtUtc = entity.Inicio,
                    endsAtUtc = entity.Fim,
                    overnightAllowed = entity.PermitePernoite,
                    vehicleRuleCount = resultingRules.Count
                }),
                detalhes: "Event authorization updated."));
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new(
                EventAuthorizationStoreStatus.Success,
                Map(entity, resultingRules, consumedQuantities));
        }
        catch (DbUpdateException exception) when (IsConstraintViolation(exception))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(EventAuthorizationStoreStatus.Conflict, null);
        }
    }

    public async Task<EventAuthorizationStoreStatus> TryCancelAsync(
        int eventId,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);
        var entity = await LockEventAsync(eventId, cancellationToken);

        if (entity is null)
        {
            return EventAuthorizationStoreStatus.NotFound;
        }

        if (!entity.Ativo)
        {
            return EventAuthorizationStoreStatus.Conflict;
        }

        entity.Cancelar(actorUserId, occurredAtUtc);
        dbContext.Auditorias.Add(new Auditoria(
            occurredAtUtc,
            TipoAcaoAuditoria.Alteracao,
            nameof(EventoAcesso),
            entity.Id,
            actorUserId,
            dadosAnteriores: JsonSerializer.Serialize(new { active = true }),
            dadosNovos: JsonSerializer.Serialize(new { active = false }),
            detalhes: "Event authorization cancelled."));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return EventAuthorizationStoreStatus.Success;
    }

    private Task<EventoAcesso?> LockEventAsync(
        int eventId,
        CancellationToken cancellationToken) =>
        dbContext.EventosAcesso
            .FromSqlInterpolated(
                $"SELECT * FROM dbo.eventos_acesso WHERE id = {eventId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

    private async Task<Dictionary<int, IReadOnlyList<AutorizacaoVeiculoEvento>>> LoadRulesAsync(
        IReadOnlyCollection<int> eventIds,
        CancellationToken cancellationToken)
    {
        if (eventIds.Count == 0)
        {
            return [];
        }

        var rules = await dbContext.AutorizacoesVeiculosEventos
            .AsNoTracking()
            .Where(rule => eventIds.Contains(rule.EventoAcessoId))
            .OrderBy(rule => rule.TipoVeiculo)
            .ThenBy(rule => rule.Placa)
            .ToListAsync(cancellationToken);

        return rules
            .GroupBy(rule => rule.EventoAcessoId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<AutorizacaoVeiculoEvento>)group.ToArray());
    }

    private static AutorizacaoVeiculoEvento[] CreateRules(
        int eventId,
        IEnumerable<EventVehicleRuleData> rules) =>
        rules.Select(rule => new AutorizacaoVeiculoEvento(
            eventId,
            rule.VehicleType,
            rule.Quantity,
            rule.Plate)).ToArray();

    private async Task<Dictionary<int, int>> LoadConsumedQuantitiesAsync(
        IReadOnlyCollection<int> ruleIds,
        CancellationToken cancellationToken)
    {
        if (ruleIds.Count == 0)
        {
            return [];
        }

        return await dbContext.RegistrosAcesso
            .AsNoTracking()
            .Where(record => record.AutorizacaoVeiculoEventoId.HasValue &&
                ruleIds.Contains(record.AutorizacaoVeiculoEventoId.Value))
            .GroupBy(record => record.AutorizacaoVeiculoEventoId!.Value)
            .Select(group => new { RuleId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.RuleId, item => item.Count, cancellationToken);
    }

    private static bool RulesMatch(
        IReadOnlyCollection<AutorizacaoVeiculoEvento> current,
        IReadOnlyCollection<EventVehicleRuleData> requested)
    {
        if (current.Count != requested.Count)
        {
            return false;
        }

        var currentValues = current
            .Select(rule => (rule.TipoVeiculo, rule.Quantidade, rule.Placa))
            .OrderBy(rule => rule.TipoVeiculo, StringComparer.Ordinal)
            .ThenBy(rule => rule.Placa, StringComparer.Ordinal)
            .ToArray();
        var requestedValues = requested
            .Select(rule => (rule.VehicleType, rule.Quantity, rule.Plate))
            .OrderBy(rule => rule.VehicleType, StringComparer.Ordinal)
            .ThenBy(rule => rule.Plate, StringComparer.Ordinal)
            .ToArray();

        return currentValues.SequenceEqual(requestedValues);
    }

    private static EventAuthorizationRecord Map(
        EventoAcesso entity,
        IEnumerable<AutorizacaoVeiculoEvento> rules,
        IReadOnlyDictionary<int, int>? consumedQuantities = null) =>
        new(
            entity.Id,
            entity.Nome,
            entity.Responsavel,
            entity.Inicio,
            entity.Fim,
            entity.LocalArea,
            entity.PermitePernoite,
            entity.Observacao,
            entity.Ativo,
            entity.CriadoPorId,
            entity.DataCriacao,
            entity.AtualizadoPorId,
            entity.DataAlteracao,
            rules.Select(rule => new EventVehicleRuleRecord(
                rule.Id,
                rule.TipoVeiculo,
                rule.Quantidade,
                rule.Placa,
                consumedQuantities?.GetValueOrDefault(rule.Id, 0) ?? 0,
                Math.Max(
                    0,
                    rule.Quantidade -
                        (consumedQuantities?.GetValueOrDefault(rule.Id, 0) ?? 0))))
                .ToArray());

    private static Auditoria CreateAudit(
        EventoAcesso entity,
        int actorUserId,
        DateTime occurredAtUtc,
        TipoAcaoAuditoria action,
        int vehicleRuleCount,
        string details) =>
        new(
            occurredAtUtc,
            action,
            nameof(EventoAcesso),
            entity.Id,
            actorUserId,
            dadosNovos: JsonSerializer.Serialize(new
            {
                active = entity.Ativo,
                startsAtUtc = entity.Inicio,
                endsAtUtc = entity.Fim,
                overnightAllowed = entity.PermitePernoite,
                vehicleRuleCount
            }),
            detalhes: details);

    private static bool IsConstraintViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation or
                PostgresErrorCodes.CheckViolation
        };
}
