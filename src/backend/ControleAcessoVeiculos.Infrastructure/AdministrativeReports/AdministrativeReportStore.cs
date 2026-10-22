using System.Text.Json;
using ControleAcessoVeiculos.Application.AdministrativeReports;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.AdministrativeReports;

public sealed class AdministrativeReportStore(ControleAcessoVeiculosDbContext dbContext)
    : IAdministrativeReportStore
{
    public async Task<PagedAdministrativeReport<VehicleMovementReportItem>>
        SearchVehicleMovementsAsync(
            AdministrativeReportCriteria criteria,
            string timeZoneId,
            CancellationToken cancellationToken)
    {
        var query =
            from access in dbContext.RegistrosAcesso.AsNoTracking()
            join vehicle in dbContext.Veiculos.AsNoTracking()
                on access.VeiculoId equals vehicle.Id
            join person in dbContext.Pessoas.AsNoTracking()
                on access.PessoaId equals person.Id
            join category in dbContext.CategoriasAcesso.AsNoTracking()
                on access.CategoriaAcessoId equals category.Id
            join authorization in dbContext.AutorizacoesVeiculosEventos.AsNoTracking()
                on access.AutorizacaoVeiculoEventoId equals authorization.Id into authorizations
            from authorization in authorizations.DefaultIfEmpty()
            join eventAccess in dbContext.EventosAcesso.AsNoTracking()
                on authorization.EventoAcessoId equals eventAccess.Id into events
            from eventAccess in events.DefaultIfEmpty()
            where access.DataHoraEntrada >= criteria.FromUtc &&
                access.DataHoraEntrada < criteria.ToExclusiveUtc
            select new
            {
                Access = access,
                Vehicle = vehicle,
                Person = person,
                Category = category,
                EventName = eventAccess == null ? null : eventAccess.Nome
            };

        if (criteria.Plate is not null)
        {
            query = query.Where(row => row.Vehicle.Placa != null &&
                EF.Functions.ILike(row.Vehicle.Placa, $"%{criteria.Plate}%"));
        }

        if (criteria.DriverName is not null)
        {
            query = query.Where(row =>
                EF.Functions.ILike(row.Person.Nome, $"%{criteria.DriverName}%"));
        }

        if (criteria.CategoryName is not null)
        {
            query = query.Where(row =>
                EF.Functions.ILike(row.Category.Nome, $"%{criteria.CategoryName}%"));
        }

        if (criteria.Status is not null)
        {
            if (!Enum.TryParse<StatusRegistroAcesso>(
                    criteria.Status,
                    true,
                    out var accessStatus))
            {
                return Page<VehicleMovementReportItem>([], criteria, 0, timeZoneId);
            }

            query = query.Where(row => row.Access.Status == accessStatus);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderByDescending(row => row.Access.DataHoraEntrada)
            .ThenByDescending(row => row.Access.Id)
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .Select(row => new VehicleMovementProjection(
                row.Access.Id,
                row.Access.DataHoraEntrada,
                row.Access.DataHoraSaida,
                row.Person.Nome,
                row.Vehicle.Tipo,
                row.Vehicle.Placa,
                row.Vehicle.IdentificacaoVeiculo,
                row.Category.Nome,
                row.Access.Objetivo,
                row.Access.Status.ToString(),
                row.Access.TipoEncerramento == null
                    ? null
                    : row.Access.TipoEncerramento.ToString(),
                row.EventName,
                row.Access.CriadoPorId,
                row.Access.AtualizadoPorId))
            .ToListAsync(cancellationToken);

        var actors = await LoadActorsAsync(
            rows.SelectMany(row => new int?[] { row.CreatedById, row.UpdatedById }),
            cancellationToken);

        var items = rows.Select(row => new VehicleMovementReportItem(
            row.Id,
            row.EntryAtUtc,
            row.ExitAtUtc,
            row.DriverName,
            row.VehicleType,
            row.Plate,
            row.VehicleIdentification,
            row.CategoryName,
            row.Objective,
            row.Status,
            row.ClosureType,
            row.EventName,
            actors[row.CreatedById],
            row.UpdatedById is { } updatedById ? actors[updatedById] : null)).ToList();

        return Page(items, criteria, totalCount, timeZoneId);
    }

    public async Task<PagedAdministrativeReport<InstitutionalFleetReportItem>>
        SearchInstitutionalFleetAsync(
            AdministrativeReportCriteria criteria,
            string timeZoneId,
            CancellationToken cancellationToken)
    {
        var query =
            from usage in dbContext.UsosVeiculosInstitucionais.AsNoTracking()
            join vehicle in dbContext.Veiculos.AsNoTracking()
                on usage.VeiculoId equals vehicle.Id
            join driver in dbContext.Pessoas.AsNoTracking()
                on usage.MotoristaId equals driver.Id
            where usage.DataHoraSaida >= criteria.FromUtc &&
                usage.DataHoraSaida < criteria.ToExclusiveUtc
            select new { Usage = usage, Vehicle = vehicle, Driver = driver };

        if (criteria.Plate is not null)
        {
            query = query.Where(row => row.Vehicle.Placa != null &&
                EF.Functions.ILike(row.Vehicle.Placa, $"%{criteria.Plate}%"));
        }

        if (criteria.VehicleIdentification is not null)
        {
            query = query.Where(row => row.Vehicle.IdentificacaoVeiculo != null &&
                EF.Functions.ILike(
                    row.Vehicle.IdentificacaoVeiculo,
                    $"%{criteria.VehicleIdentification}%"));
        }

        if (criteria.DriverName is not null)
        {
            query = query.Where(row =>
                EF.Functions.ILike(row.Driver.Nome, $"%{criteria.DriverName}%"));
        }

        if (criteria.Status is not null)
        {
            if (!Enum.TryParse<StatusUsoVeiculoInstitucional>(
                    criteria.Status,
                    true,
                    out var usageStatus))
            {
                return Page<InstitutionalFleetReportItem>([], criteria, 0, timeZoneId);
            }

            query = query.Where(row => row.Usage.Status == usageStatus);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderByDescending(row => row.Usage.DataHoraSaida)
            .ThenByDescending(row => row.Usage.Id)
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .Select(row => new InstitutionalFleetProjection(
                row.Usage.Id,
                row.Vehicle.Placa,
                row.Vehicle.IdentificacaoVeiculo,
                row.Driver.Nome,
                row.Usage.DataHoraSaida,
                row.Usage.QuilometragemSaida,
                row.Usage.DataHoraEntrada,
                row.Usage.QuilometragemEntrada,
                row.Usage.Itinerario,
                row.Usage.Status.ToString(),
                row.Usage.CriadoPorId,
                row.Usage.AtualizadoPorId))
            .ToListAsync(cancellationToken);

        var actors = await LoadActorsAsync(
            rows.SelectMany(row => new int?[] { row.CreatedById, row.UpdatedById }),
            cancellationToken);

        var items = rows.Select(row => new InstitutionalFleetReportItem(
            row.Id,
            row.Plate,
            row.VehicleIdentification,
            row.DriverName,
            row.DepartureAtUtc,
            row.DepartureMileage,
            row.ReturnAtUtc,
            row.ReturnMileage,
            row.ReturnMileage.HasValue
                ? row.ReturnMileage.Value - row.DepartureMileage
                : null,
            row.Itinerary,
            row.Status,
            actors[row.CreatedById],
            row.UpdatedById is { } updatedById ? actors[updatedById] : null)).ToList();

        return Page(items, criteria, totalCount, timeZoneId);
    }

    public async Task RecordConsultationAsync(
        int actorUserId,
        string reportType,
        DateOnly from,
        DateOnly to,
        bool succeeded,
        CancellationToken cancellationToken) =>
        await RecordActionAsync(
            actorUserId,
            "Consultation",
            reportType,
            from,
            to,
            succeeded,
            cancellationToken);

    public async Task RecordExportAsync(
        int actorUserId,
        string reportType,
        DateOnly from,
        DateOnly to,
        bool succeeded,
        CancellationToken cancellationToken) =>
        await RecordActionAsync(
            actorUserId,
            "Export",
            reportType,
            from,
            to,
            succeeded,
            cancellationToken);

    private async Task RecordActionAsync(
        int actorUserId,
        string operation,
        string reportType,
        DateOnly from,
        DateOnly to,
        bool succeeded,
        CancellationToken cancellationToken)
    {
        var details = JsonSerializer.Serialize(new
        {
            Operation = operation,
            ReportType = reportType,
            From = from.ToString("yyyy-MM-dd"),
            To = to.ToString("yyyy-MM-dd"),
            Result = succeeded ? "Success" : "Failure"
        });
        dbContext.Auditorias.Add(new Auditoria(
            DateTime.UtcNow,
            TipoAcaoAuditoria.Consulta,
            "AdministrativeReport",
            actorUserId,
            actorUserId,
            detalhes: details));
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<IReadOnlyDictionary<int, ReportActor>> LoadActorsAsync(
        IEnumerable<int?> actorIds,
        CancellationToken cancellationToken)
    {
        var ids = actorIds.Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToArray();

        return await (
            from user in dbContext.Usuarios.AsNoTracking()
            join person in dbContext.Pessoas.AsNoTracking()
                on user.PessoaId equals person.Id
            join profile in dbContext.Perfis.AsNoTracking()
                on user.PerfilId equals profile.Id
            where ids.Contains(user.Id)
            select new ReportActor(user.Id, person.Nome, profile.Nome))
            .ToDictionaryAsync(actor => actor.UserId, cancellationToken);
    }

    private static PagedAdministrativeReport<T> Page<T>(
        IReadOnlyList<T> items,
        AdministrativeReportCriteria criteria,
        int totalCount,
        string timeZoneId) =>
        new(
            items,
            criteria.Page,
            criteria.PageSize,
            totalCount,
            (int)Math.Ceiling(totalCount / (double)criteria.PageSize),
            criteria.From,
            criteria.To,
            timeZoneId);

    private sealed record VehicleMovementProjection(
        int Id,
        DateTime EntryAtUtc,
        DateTime? ExitAtUtc,
        string DriverName,
        string? VehicleType,
        string? Plate,
        string? VehicleIdentification,
        string CategoryName,
        string Objective,
        string Status,
        string? ClosureType,
        string? EventName,
        int CreatedById,
        int? UpdatedById);

    private sealed record InstitutionalFleetProjection(
        int Id,
        string? Plate,
        string? VehicleIdentification,
        string DriverName,
        DateTime DepartureAtUtc,
        int DepartureMileage,
        DateTime? ReturnAtUtc,
        int? ReturnMileage,
        string Itinerary,
        string Status,
        int CreatedById,
        int? UpdatedById);
}
