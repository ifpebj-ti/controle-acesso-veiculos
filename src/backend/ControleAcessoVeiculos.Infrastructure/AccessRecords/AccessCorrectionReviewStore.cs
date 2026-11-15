using System.Text.Json;
using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ControleAcessoVeiculos.Infrastructure.AccessRecords;

public sealed class AccessCorrectionReviewStore(ControleAcessoVeiculosDbContext dbContext)
    : IAccessCorrectionReviewStore
{
    public async Task<AccessCorrectionOperationResult> SubmitAsync(
        int accessRecordId, SubmitAccessCorrectionCommand command, int actorId,
        DateTime nowUtc, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var access = await LockAccessAsync(accessRecordId, cancellationToken);
            if (access is null) return new(AccessCorrectionOperationStatus.NotFound);

            var previous = await dbContext.SolicitacoesCorrecaoAcesso.SingleOrDefaultAsync(
                x => x.SolicitadoPorId == actorId && x.ChaveRequisicao == command.RequestKey,
                cancellationToken);
            if (previous is not null)
            {
                var canonical = await Project(dbContext.SolicitacoesCorrecaoAcesso.Where(x => x.Id == previous.Id))
                    .SingleAsync(cancellationToken);
                return canonical.AccessRecordId == accessRecordId && canonical.Original == command.Original &&
                    canonical.Proposed == command.Proposed && canonical.Justification == command.Justification
                    ? new(AccessCorrectionOperationStatus.Success, canonical)
                    : new(AccessCorrectionOperationStatus.Conflict);
            }

            if (await dbContext.SolicitacoesCorrecaoAcesso.AnyAsync(
                x => x.RegistroAcessoId == accessRecordId && x.Status == StatusSolicitacaoCorrecao.Pendente,
                cancellationToken))
            {
                return new(AccessCorrectionOperationStatus.Conflict);
            }

            var categoryName = await dbContext.CategoriasAcesso
                .Where(x => x.Id == access.CategoriaAcessoId).Select(x => x.Nome).SingleAsync(cancellationToken);
            var current = new AccessCorrectionValues(categoryName, access.Objetivo, access.Observacao);
            if (current != command.Original || current == command.Proposed)
            {
                return new(AccessCorrectionOperationStatus.Conflict);
            }

            var category = await dbContext.CategoriasAcesso.SingleOrDefaultAsync(
                x => x.Nome == command.Proposed.CategoryName, cancellationToken);
            if (category is not null && !category.Ativo) return new(AccessCorrectionOperationStatus.Conflict);
            if (category is null)
            {
                category = new(command.Proposed.CategoryName, "Categoria preliminar do MVP; sujeita à validação do cliente.");
                dbContext.CategoriasAcesso.Add(category);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            var request = new SolicitacaoCorrecaoAcesso(command.RequestKey, accessRecordId, actorId,
                new(access.CategoriaAcessoId, access.Objetivo, access.Observacao),
                new(category.Id, command.Proposed.Objective, command.Proposed.Observation),
                command.Justification, nowUtc);
            dbContext.SolicitacoesCorrecaoAcesso.Add(request);
            await dbContext.SaveChangesAsync(cancellationToken);
            AddAudit(request, actorId, nowUtc, "Requested");
            await dbContext.SaveChangesAsync(cancellationToken);
            var result = await Project(dbContext.SolicitacoesCorrecaoAcesso.Where(x => x.Id == request.Id))
                .SingleAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new(AccessCorrectionOperationStatus.Success, result, Created: true);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException
        { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(AccessCorrectionOperationStatus.Conflict);
        }
    }

    public async Task<AccessCorrectionOperationResult> DecideAsync(
        int requestId, StatusSolicitacaoCorrecao decision, string reason,
        int actorId, DateTime nowUtc, CancellationToken cancellationToken)
    {
        var accessId = await dbContext.SolicitacoesCorrecaoAcesso.AsNoTracking()
            .Where(x => x.Id == requestId).Select(x => (int?)x.RegistroAcessoId)
            .SingleOrDefaultAsync(cancellationToken);
        if (!accessId.HasValue) return new(AccessCorrectionOperationStatus.NotFound);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        // Every path locks the access first, then its request: a stable lock order.
        var access = await LockAccessAsync(accessId.Value, cancellationToken);
        if (access is null) return new(AccessCorrectionOperationStatus.NotFound);
        var request = await dbContext.SolicitacoesCorrecaoAcesso
            .FromSqlInterpolated($"SELECT * FROM dbo.solicitacoes_correcao_acesso WHERE id = {requestId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        if (decision == StatusSolicitacaoCorrecao.Cancelada ? request.SolicitadoPorId != actorId : request.SolicitadoPorId == actorId)
        {
            return new(AccessCorrectionOperationStatus.Forbidden);
        }

        if (request.Status != StatusSolicitacaoCorrecao.Pendente)
        {
            if (request.Status != decision || request.DecididoPorId != actorId || request.MotivoDecisao != reason)
                return new(AccessCorrectionOperationStatus.Conflict);
            var repeated = await Project(dbContext.SolicitacoesCorrecaoAcesso.Where(x => x.Id == requestId))
                .SingleAsync(cancellationToken);
            return new(AccessCorrectionOperationStatus.Success, repeated);
        }

        if (nowUtc < request.SolicitadoEmUtc) return new(AccessCorrectionOperationStatus.Conflict);

        if (decision == StatusSolicitacaoCorrecao.Aprovada)
        {
            var original = new ValoresDescritivosAcesso(access.CategoriaAcessoId, access.Objetivo, access.Observacao);
            var categoryActive = await dbContext.CategoriasAcesso.AnyAsync(
                x => x.Id == request.Proposto.CategoriaAcessoId && x.Ativo, cancellationToken);
            if (original != request.Original || !categoryActive) return new(AccessCorrectionOperationStatus.Conflict);
            request.Aprovar(actorId, reason, nowUtc, original);
            access.CorrigirDados(request.Proposto.CategoriaAcessoId, request.Proposto.Objetivo,
                request.Proposto.Observacao, actorId, nowUtc);
        }
        else if (decision == StatusSolicitacaoCorrecao.Rejeitada)
        {
            request.Rejeitar(actorId, reason, nowUtc);
        }
        else
        {
            request.Cancelar(actorId, reason, nowUtc);
        }

        AddAudit(request, actorId, nowUtc, decision.ToString());
        await dbContext.SaveChangesAsync(cancellationToken);
        var result = await Project(dbContext.SolicitacoesCorrecaoAcesso.Where(x => x.Id == requestId))
            .SingleAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new(AccessCorrectionOperationStatus.Success, result);
    }

    public Task<AccessCorrectionRecord?> GetAsync(
        int requestId, int actorId, bool canReview, CancellationToken cancellationToken) =>
        Project(Visible(actorId, canReview).Where(x => x.Id == requestId))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<AccessCorrectionRecord?> GetByKeyAsync(
        Guid requestKey, int actorId, CancellationToken cancellationToken) =>
        Project(Visible(actorId, false).Where(x => x.ChaveRequisicao == requestKey))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<AccessCorrectionPage> SearchAsync(
        int actorId, bool canReview, StatusSolicitacaoCorrecao? status,
        int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = Visible(actorId, canReview);
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);
        var count = await query.CountAsync(cancellationToken);
        var items = await Project(query.OrderByDescending(x => x.SolicitadoEmUtc).ThenByDescending(x => x.Id)
                .Skip((page - 1) * pageSize).Take(pageSize))
            .ToListAsync(cancellationToken);
        return new(items, page, pageSize, count, (int)Math.Ceiling(count / (double)pageSize));
    }

    private IQueryable<SolicitacaoCorrecaoAcesso> Visible(int actorId, bool canReview) =>
        dbContext.SolicitacoesCorrecaoAcesso.AsNoTracking()
            .Where(x => canReview || x.SolicitadoPorId == actorId);

    private Task<RegistroAcesso?> LockAccessAsync(int id, CancellationToken cancellationToken) =>
        dbContext.RegistrosAcesso.FromSqlInterpolated(
            $"SELECT * FROM dbo.registros_acesso WHERE id = {id} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

    private IQueryable<AccessCorrectionRecord> Project(IQueryable<SolicitacaoCorrecaoAcesso> query) =>
        from request in query
        join access in dbContext.RegistrosAcesso on request.RegistroAcessoId equals access.Id
        join vehicle in dbContext.Veiculos on access.VeiculoId equals vehicle.Id
        join person in dbContext.Pessoas on access.PessoaId equals person.Id
        join originalCategory in dbContext.CategoriasAcesso on request.Original.CategoriaAcessoId equals originalCategory.Id
        join proposedCategory in dbContext.CategoriasAcesso on request.Proposto.CategoriaAcessoId equals proposedCategory.Id
        select new AccessCorrectionRecord(request.Id, access.Id, vehicle.Placa, person.Nome, vehicle.IdentificacaoVeiculo,
            request.ChaveRequisicao, request.Status.ToString(), request.SolicitadoPorId, request.SolicitadoEmUtc,
            new(originalCategory.Nome, request.Original.Objetivo, request.Original.Observacao),
            new(proposedCategory.Nome, request.Proposto.Objetivo, request.Proposto.Observacao),
            request.Justificativa, request.DecididoPorId, request.DecididoEmUtc, request.MotivoDecisao);

    private void AddAudit(SolicitacaoCorrecaoAcesso request, int actorId, DateTime nowUtc, string action) =>
        dbContext.Auditorias.Add(new(nowUtc,
            action == "Requested" ? TipoAcaoAuditoria.Inclusao : TipoAcaoAuditoria.Alteracao,
            "SolicitacaoCorrecaoAcesso", request.Id, actorId,
            dadosNovos: JsonSerializer.Serialize(new { action, accessRecordId = request.RegistroAcessoId }),
            detalhes: "Revisão de correção; valores e motivos restritos à solicitação, sem duplicação no log."));
}
