using System.Security.Cryptography;
using System.Text.Json;
using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Contingency;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.AccessRecords;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ControleAcessoVeiculos.Infrastructure.Contingency;

public sealed class PaperReconciliationStore(
    ControleAcessoVeiculosDbContext db, VehicleAccessStore accessStore)
    : IPaperReconciliationStore, IPaperReconciliationCatalog
{
    public async Task<PaperReconciliationResult> TryImportAsync(PaperImportData data,
        int actorUserId, DateTime importedAtUtc, CancellationToken cancellationToken)
    {
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        var committed = false;
        try
        {
            await LockAsync($"paper/request/{actorUserId}/{data.RequestKey}", cancellationToken);
            await LockAsync($"paper/line/{data.IncidentId}/{data.LineNumber}", cancellationToken);
            var fingerprint = Convert.ToHexStringLower(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(data)));
            var previous = await db.ReconciliacoesContingencia.AsNoTracking().SingleOrDefaultAsync(
                x => x.DigitadoPorId == actorUserId && x.ChaveIntencao == data.RequestKey, cancellationToken);
            if (previous is not null)
                return previous.AssinaturaIntencao == fingerprint
                    ? Success(previous) : Conflict("paper_request_changed");
            if (await db.ReconciliacoesContingencia.AnyAsync(
                x => x.IncidenteId == data.IncidentId && x.NumeroLinha == data.LineNumber, cancellationToken))
                return Conflict("paper_line_already_imported");
            var incident = await db.IncidentesContingencia.AsNoTracking().SingleOrDefaultAsync(
                x => x.ChaveIncidente == data.IncidentId, cancellationToken);
            if (incident is null) return new(PaperReconciliationStatus.NotFound, Code: "paper_incident_not_found");
            if (!incident.Contem(data.ObservedEntryAtUtc, data.ObservedExitAtUtc) || incident.FimUtc > importedAtUtc)
                return Conflict("paper_outside_incident");

            // Serialize paper imports for one vehicle; ordinary open-entry uniqueness remains enforced by PostgreSQL.
            var selectedPlate = data.Entry.VehicleId is int vehicleId
                ? await db.Veiculos.Where(x => x.Id == vehicleId).Select(x => x.Placa).SingleOrDefaultAsync(cancellationToken)
                : data.Entry.Plate;
            if (selectedPlate is null) return Conflict("paper_vehicle_unavailable");
            await LockAsync($"paper/vehicle/{selectedPlate}", cancellationToken);
            var until = data.ObservedExitAtUtc ?? DateTime.SpecifyKind(DateTime.MaxValue, DateTimeKind.Utc);
            if (await (from record in db.RegistrosAcesso
                       join vehicle in db.Veiculos on record.VeiculoId equals vehicle.Id
                       where vehicle.Placa == selectedPlate && record.DataHoraEntrada < until &&
                           (record.DataHoraSaida == null || record.DataHoraSaida > data.ObservedEntryAtUtc)
                       select record.Id).AnyAsync(cancellationToken))
                return Conflict("paper_access_overlap");

            var result = await accessStore.RegisterEntryInTransactionAsync(data.Entry, actorUserId,
                data.ObservedEntryAtUtc, data.ObservedExitAtUtc, importedAtUtc, cancellationToken);
            if (result.Status != VehicleAccessStoreRegistrationStatus.Success)
                return Conflict("paper_entry_" + result.Status);
            var row = new ReconciliacaoContingencia(data.IncidentId, data.LineNumber,
                result.AccessRecord!.Id, data.PaperAuthorReference, actorUserId,
                data.ObservedEntryAtUtc, data.ObservedExitAtUtc, Microseconds(importedAtUtc),
                data.Justification, data.RequestKey, fingerprint);
            db.ReconciliacoesContingencia.Add(row);
            db.Auditorias.Add(Audit(row, actorUserId, importedAtUtc, "paper_imported"));
            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
            committed = true;
            return Success(row);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            await tx.RollbackAsync(cancellationToken);
            return Conflict("paper_concurrent_conflict");
        }
        finally
        {
            if (!committed) db.ChangeTracker.Clear();
        }
    }

    public async Task<PaperReconciliationResult> TryReviewAsync(int accessRecordId, bool accept,
        string reason, int reviewerUserId, DateTime reviewedAtUtc, CancellationToken cancellationToken)
    {
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        var committed = false;
        try
        {
            var row = await db.ReconciliacoesContingencia.FromSqlInterpolated(
                $"SELECT * FROM dbo.reconciliacoes_contingencia WHERE registro_acesso_id = {accessRecordId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);
            if (row is null) return new(PaperReconciliationStatus.NotFound);
            if (row.DigitadoPorId == reviewerUserId) return new(PaperReconciliationStatus.Forbidden, Code: "paper_self_review");
            if (reviewedAtUtc < row.DigitadoEmUtc) return Conflict("paper_clock_before_import");
            bool changed;
            try { changed = row.Conferir(accept, reviewerUserId, reason, Microseconds(reviewedAtUtc)); }
            catch (InvalidOperationException) { return Conflict("paper_review_already_decided"); }
            if (changed)
            {
                db.Auditorias.Add(Audit(row, reviewerUserId, reviewedAtUtc, "paper_reviewed"));
                await db.SaveChangesAsync(cancellationToken);
            }
            await tx.CommitAsync(cancellationToken);
            committed = true;
            return Success(row);
        }
        finally
        {
            if (!committed) db.ChangeTracker.Clear();
        }
    }

    public async Task<PaperIncidentRecord?> RegisterIncidentAsync(RegisterPaperIncidentCommand command,
        int actorUserId, DateTime createdAtUtc, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        try
        {
            await LockAsync($"paper/incident/{command.IncidentId}", ct);
            var previous = await db.IncidentesContingencia.AsNoTracking().SingleOrDefaultAsync(
                x => x.ChaveIncidente == command.IncidentId, ct);
            if (previous is not null)
                return previous.CriadoPorId == actorUserId && previous.ReferenciaPapel == command.PaperReference.Trim() &&
                    previous.InicioUtc == Microseconds(command.StartedAt.UtcDateTime) && previous.FimUtc == Microseconds(command.EndedAt.UtcDateTime)
                    ? MapIncident(previous) : null;
            var incident = new IncidenteContingencia(command.IncidentId, command.PaperReference,
                Microseconds(command.StartedAt.UtcDateTime), Microseconds(command.EndedAt.UtcDateTime),
                actorUserId, Microseconds(createdAtUtc));
            db.IncidentesContingencia.Add(incident);
            await db.SaveChangesAsync(ct);
            db.Auditorias.Add(new Auditoria(createdAtUtc, TipoAcaoAuditoria.Inclusao,
                nameof(IncidenteContingencia), incident.Id, actorUserId,
                dadosNovos: JsonSerializer.Serialize(new { incidentId = incident.ChaveIncidente }),
                detalhes: "paper_incident_registered"));
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return MapIncident(incident);
        }
        catch
        {
            db.ChangeTracker.Clear();
            throw;
        }
    }

    public async Task<IReadOnlyList<PaperIncidentRecord>> ListIncidentsAsync(int page, int pageSize, CancellationToken ct) =>
        await db.IncidentesContingencia.AsNoTracking().OrderByDescending(x => x.InicioUtc).ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new PaperIncidentRecord(x.ChaveIncidente, x.ReferenciaPapel, x.InicioUtc,
                x.FimUtc, x.CriadoPorId, x.CriadoEmUtc)).ToListAsync(ct);

    public async Task<PaperReconciliationPage> SearchAsync(string? status, int? importedById,
        int page, int pageSize, CancellationToken ct)
    {
        var query = db.ReconciliacoesContingencia.AsNoTracking();
        if (importedById.HasValue) query = query.Where(x => x.DigitadoPorId == importedById);
        if (!string.IsNullOrEmpty(status))
        {
            var selected = Enum.Parse<StatusConferenciaContingencia>(status);
            query = query.Where(x => x.Status == selected);
        }
        var count = await query.CountAsync(ct);
        var items = await (from row in query
                           join access in db.RegistrosAcesso on row.RegistroAcessoId equals access.Id
                           join vehicle in db.Veiculos on access.VeiculoId equals vehicle.Id
                           join person in db.Pessoas on access.PessoaId equals person.Id
                           orderby row.DigitadoEmUtc, row.RegistroAcessoId
                           select new PaperReconciliationItem(row.RegistroAcessoId, row.IncidenteId,
                               row.NumeroLinha, row.ReferenciaAutorPapel, row.DigitadoPorId,
                               row.EntradaObservadaUtc, row.SaidaObservadaNoPapelUtc, row.DigitadoEmUtc,
                               row.Justificativa, row.Status.ToString(), row.ConferidoPorId,
                               row.ConferidoEmUtc, row.MotivoConferencia, vehicle.Placa!, person.Nome))
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new(items, count, page, pageSize);
    }

    private Task<int> LockAsync(string key, CancellationToken ct) =>
        db.Database.ExecuteSqlAsync($"SELECT pg_advisory_xact_lock(hashtextextended({key}, 0))", ct);
    private static DateTime Microseconds(DateTime value) => value.AddTicks(-(value.Ticks % 10));
    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
    private static PaperReconciliationResult Conflict(string code) => new(PaperReconciliationStatus.Conflict, Code: code);
    private static PaperReconciliationResult Success(ReconciliacaoContingencia row) => new(
        PaperReconciliationStatus.Success, new(row.RegistroAcessoId, row.Status.ToString(), row.DigitadoEmUtc));
    private static PaperIncidentRecord MapIncident(IncidenteContingencia row) => new(
        row.ChaveIncidente, row.ReferenciaPapel, row.InicioUtc, row.FimUtc, row.CriadoPorId, row.CriadoEmUtc);
    private static Auditoria Audit(ReconciliacaoContingencia row, int actor, DateTime at, string operation) => new(
        at, TipoAcaoAuditoria.Alteracao, nameof(ReconciliacaoContingencia), row.RegistroAcessoId, actor,
        dadosNovos: JsonSerializer.Serialize(new { accessRecordId = row.RegistroAcessoId, status = row.Status.ToString() }),
        detalhes: operation);
}
