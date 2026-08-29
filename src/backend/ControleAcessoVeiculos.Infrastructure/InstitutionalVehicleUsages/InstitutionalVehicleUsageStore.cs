using ControleAcessoVeiculos.Application.InstitutionalVehicleUsages;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Text.Json;

namespace ControleAcessoVeiculos.Infrastructure.InstitutionalVehicleUsages;

public sealed class InstitutionalVehicleUsageStore(
    ControleAcessoVeiculosDbContext dbContext) : IInstitutionalVehicleUsageStore
{
    public async Task<InstitutionalVehicleDepartureStoreResult> TryRegisterDepartureAsync(
        int vehicleId,
        int driverId,
        int departureMileage,
        string itinerary,
        int actorUserId,
        DateTime departureAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        try
        {
            var vehicle = await dbContext.Veiculos.SingleOrDefaultAsync(
                item => item.Id == vehicleId,
                cancellationToken);
            var driver = await dbContext.Pessoas.SingleOrDefaultAsync(
                item => item.Id == driverId && item.Ativo &&
                    dbContext.MotoristasInstitucionais.Any(authorization =>
                        authorization.PessoaId == item.Id && authorization.Ativo),
                cancellationToken);

            if (vehicle is null || !vehicle.Ativo || !vehicle.EhInstitucional ||
                driver is null)
            {
                return new InstitutionalVehicleDepartureStoreResult(
                    InstitutionalVehicleDepartureStoreStatus.NotFound,
                    null);
            }

            if (await dbContext.UsosVeiculosInstitucionais.AnyAsync(
                    item => item.VeiculoId == vehicleId &&
                        item.Status != StatusUsoVeiculoInstitucional.Concluido,
                    cancellationToken))
            {
                return ConflictDeparture();
            }

            var usage = new UsoVeiculoInstitucional(
                vehicleId,
                driverId,
                departureAtUtc,
                departureMileage,
                itinerary,
                actorUserId);
            dbContext.UsosVeiculosInstitucionais.Add(usage);
            await dbContext.SaveChangesAsync(cancellationToken);

            dbContext.Auditorias.Add(CreateDepartureAudit(
                usage,
                actorUserId,
                departureAtUtc));
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new InstitutionalVehicleDepartureStoreResult(
                InstitutionalVehicleDepartureStoreStatus.Success,
                Map(usage, vehicle, driver));
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: "ux_usos_institucionais_veiculo_aberto"
            })
        {
            await transaction.RollbackAsync(cancellationToken);
            return ConflictDeparture();
        }
    }

    public async Task<IReadOnlyList<InstitutionalVehicleUsageRecord>> ListOpenAsync(
        CancellationToken cancellationToken) =>
        await Project(dbContext.UsosVeiculosInstitucionais
                .AsNoTracking()
                .Where(item => item.Status != StatusUsoVeiculoInstitucional.Concluido)
                .OrderBy(item => item.DataHoraSaida))
            .ToListAsync(cancellationToken);

    public async Task<PagedInstitutionalVehicleUsageResult> SearchAsync(
        InstitutionalVehicleUsageSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        var usages = dbContext.UsosVeiculosInstitucionais
            .AsNoTracking()
            .Where(item => item.DataHoraSaida >= criteria.FromUtc &&
                item.DataHoraSaida <= criteria.ToUtc);

        if (criteria.VehicleId.HasValue)
        {
            usages = usages.Where(item => item.VeiculoId == criteria.VehicleId.Value);
        }

        if (criteria.DriverId.HasValue)
        {
            usages = usages.Where(item => item.MotoristaId == criteria.DriverId.Value);
        }

        if (criteria.Plate is not null)
        {
            usages = usages.Where(item => dbContext.Veiculos.Any(vehicle =>
                vehicle.Id == item.VeiculoId && vehicle.Placa == criteria.Plate));
        }

        if (criteria.VehicleIdentification is not null)
        {
            usages = usages.Where(item => dbContext.Veiculos.Any(vehicle =>
                vehicle.Id == item.VeiculoId &&
                vehicle.IdentificacaoVeiculo == criteria.VehicleIdentification));
        }

        var totalCount = await usages.CountAsync(cancellationToken);
        var items = await Project(usages
                .OrderByDescending(item => item.DataHoraSaida)
                .ThenByDescending(item => item.Id)
                .Skip((criteria.Page - 1) * criteria.PageSize)
                .Take(criteria.PageSize))
            .ToListAsync(cancellationToken);
        var totalPages = totalCount == 0
            ? 0
            : ((totalCount - 1) / criteria.PageSize) + 1;

        return new(
            items,
            criteria.Page,
            criteria.PageSize,
            totalCount,
            totalPages);
    }

    public async Task<InstitutionalVehicleReturnStoreResult> TryRegisterReturnAsync(
        int usageId,
        int returnMileage,
        int actorUserId,
        DateTime returnAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        var usage = await dbContext.UsosVeiculosInstitucionais
            .FromSqlInterpolated(
                $"SELECT * FROM dbo.usos_veiculos_institucionais WHERE id = {usageId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (usage is null)
        {
            return new InstitutionalVehicleReturnStoreResult(
                InstitutionalVehicleReturnStoreStatus.NotFound,
                null);
        }

        if (usage.Status == StatusUsoVeiculoInstitucional.Concluido)
        {
            return new InstitutionalVehicleReturnStoreResult(
                InstitutionalVehicleReturnStoreStatus.Conflict,
                null);
        }

        if (returnMileage < usage.QuilometragemSaida)
        {
            return new InstitutionalVehicleReturnStoreResult(
                InstitutionalVehicleReturnStoreStatus.InvalidMileage,
                null);
        }

        var previousStatus = usage.Status;
        usage.RegistrarRetorno(returnAtUtc, returnMileage, actorUserId);
        dbContext.Auditorias.Add(CreateReturnAudit(
            usage,
            previousStatus,
            actorUserId,
            returnAtUtc));
        await dbContext.SaveChangesAsync(cancellationToken);

        var result = await Project(dbContext.UsosVeiculosInstitucionais
                .AsNoTracking()
                .Where(item => item.Id == usageId))
            .SingleAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
        return new InstitutionalVehicleReturnStoreResult(
            InstitutionalVehicleReturnStoreStatus.Success,
            result);
    }

    private IQueryable<InstitutionalVehicleUsageRecord> Project(
        IQueryable<UsoVeiculoInstitucional> usages) =>
        from usage in usages
        join vehicle in dbContext.Veiculos.AsNoTracking()
            on usage.VeiculoId equals vehicle.Id
        join driver in dbContext.Pessoas.AsNoTracking()
            on usage.MotoristaId equals driver.Id
        select new InstitutionalVehicleUsageRecord(
            usage.Id,
            vehicle.Id,
            vehicle.Placa,
            vehicle.IdentificacaoVeiculo,
            driver.Id,
            driver.Nome,
            usage.DataHoraSaida,
            usage.QuilometragemSaida,
            usage.Itinerario,
            usage.DataHoraEntrada,
            usage.QuilometragemEntrada,
            usage.Status.ToString(),
            usage.CriadoPorId,
            usage.AtualizadoPorId);

    private static InstitutionalVehicleUsageRecord Map(
        UsoVeiculoInstitucional usage,
        Veiculo vehicle,
        Pessoa driver) =>
        new(
            usage.Id,
            vehicle.Id,
            vehicle.Placa,
            vehicle.IdentificacaoVeiculo,
            driver.Id,
            driver.Nome,
            usage.DataHoraSaida,
            usage.QuilometragemSaida,
            usage.Itinerario,
            usage.DataHoraEntrada,
            usage.QuilometragemEntrada,
            usage.Status.ToString(),
            usage.CriadoPorId,
            usage.AtualizadoPorId);

    private static Auditoria CreateDepartureAudit(
        UsoVeiculoInstitucional usage,
        int actorUserId,
        DateTime occurredAtUtc) =>
        new(
            occurredAtUtc,
            TipoAcaoAuditoria.Inclusao,
            nameof(UsoVeiculoInstitucional),
            usage.Id,
            actorUserId,
            dadosNovos: JsonSerializer.Serialize(new
            {
                status = StatusUsoVeiculoInstitucional.EmUso.ToString(),
                vehicleId = usage.VeiculoId,
                driverId = usage.MotoristaId,
                departureMileage = usage.QuilometragemSaida
            }),
            detalhes: "Institutional vehicle departure registered.");

    private static Auditoria CreateReturnAudit(
        UsoVeiculoInstitucional usage,
        StatusUsoVeiculoInstitucional previousStatus,
        int actorUserId,
        DateTime occurredAtUtc) =>
        new(
            occurredAtUtc,
            TipoAcaoAuditoria.Alteracao,
            nameof(UsoVeiculoInstitucional),
            usage.Id,
            actorUserId,
            dadosAnteriores: JsonSerializer.Serialize(new
            {
                status = previousStatus.ToString()
            }),
            dadosNovos: JsonSerializer.Serialize(new
            {
                status = StatusUsoVeiculoInstitucional.Concluido.ToString(),
                returnMileage = usage.QuilometragemEntrada
            }),
            detalhes: "Institutional vehicle return registered.");

    private static InstitutionalVehicleDepartureStoreResult ConflictDeparture() =>
        new(InstitutionalVehicleDepartureStoreStatus.Conflict, null);
}
