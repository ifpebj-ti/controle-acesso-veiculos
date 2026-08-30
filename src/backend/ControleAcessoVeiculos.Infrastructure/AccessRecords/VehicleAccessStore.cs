using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Text.Json;

namespace ControleAcessoVeiculos.Infrastructure.AccessRecords;

public sealed class VehicleAccessStore(ControleAcessoVeiculosDbContext dbContext)
    : IVehicleAccessStore
{
    public async Task<VehicleAccessStoreRegistration> TryRegisterEntryAsync(
        VehicleEntryData entry,
        int actorUserId,
        DateTime entryAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        try
        {
            var vehicle = await dbContext.Veiculos.SingleOrDefaultAsync(
                item => item.Placa == entry.Plate,
                cancellationToken);

            if (vehicle is not null && !vehicle.Ativo)
            {
                return Conflict();
            }

            if (vehicle is not null && await dbContext.RegistrosAcesso.AnyAsync(
                    item => item.VeiculoId == vehicle.Id &&
                        item.Status == StatusRegistroAcesso.Aberto,
                    cancellationToken))
            {
                return Conflict();
            }

            if (vehicle is null)
            {
                vehicle = new Veiculo(
                    entry.Plate,
                    entry.VehicleType,
                    identificacaoVeiculo: null,
                    ehInstitucional: false,
                    entry.Brand,
                    entry.Model,
                    entry.Color,
                    entry.Year);
                dbContext.Veiculos.Add(vehicle);
            }

            Pessoa? person = null;

            if (entry.DocumentType is not null && entry.DocumentNumber is not null)
            {
                person = await dbContext.Pessoas.SingleOrDefaultAsync(
                    item => item.DocumentoTipo == entry.DocumentType &&
                        item.DocumentoNumero == entry.DocumentNumber,
                    cancellationToken);
            }

            if (person is not null && !person.Ativo)
            {
                return Conflict();
            }

            if (person is null)
            {
                person = new Pessoa(
                    entry.DriverName,
                    entry.DocumentType,
                    entry.DocumentNumber);
                dbContext.Pessoas.Add(person);
            }

            var category = await dbContext.CategoriasAcesso.SingleOrDefaultAsync(
                item => item.Nome == entry.CategoryName,
                cancellationToken);

            if (category is not null && !category.Ativo)
            {
                return Conflict();
            }

            if (category is null)
            {
                category = new CategoriaAcesso(
                    entry.CategoryName,
                    "Categoria preliminar do MVP; sujeita à validação do cliente.");
                dbContext.CategoriasAcesso.Add(category);
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            var relationshipExists = await dbContext.PessoasVeiculos.AnyAsync(
                item => item.PessoaId == person.Id &&
                    item.VeiculoId == vehicle.Id &&
                    item.TipoRelacao == "Condutor",
                cancellationToken);

            if (!relationshipExists)
            {
                dbContext.PessoasVeiculos.Add(new PessoaVeiculo(
                    person.Id,
                    vehicle.Id,
                    "Condutor",
                    DateOnly.FromDateTime(entryAtUtc)));
            }

            var accessRecord = new RegistroAcesso(
                vehicle.Id,
                person.Id,
                category.Id,
                entryAtUtc,
                entry.Objective,
                actorUserId,
                entry.Observation);
            dbContext.RegistrosAcesso.Add(accessRecord);

            await dbContext.SaveChangesAsync(cancellationToken);

            dbContext.Auditorias.Add(CreateEntryAudit(accessRecord, actorUserId, entryAtUtc));
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new VehicleAccessStoreRegistration(
                VehicleAccessStoreRegistrationStatus.Success,
                Map(accessRecord, vehicle, person, category));
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            })
        {
            await transaction.RollbackAsync(cancellationToken);
            return Conflict();
        }
    }

    public async Task<IReadOnlyList<VehicleAccessRecord>> ListOpenAsync(
        CancellationToken cancellationToken) =>
        await ProjectRecords(dbContext.RegistrosAcesso
                .AsNoTracking()
                .Where(item => item.Status == StatusRegistroAcesso.Aberto)
                .OrderBy(item => item.DataHoraEntrada))
            .ToListAsync(cancellationToken);

    public async Task<PagedVehicleAccessResult> SearchAsync(
        VehicleAccessSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        var accessRecords = dbContext.RegistrosAcesso
            .AsNoTracking()
            .Where(item => item.DataHoraEntrada >= criteria.FromUtc &&
                item.DataHoraEntrada <= criteria.ToUtc);

        if (criteria.Plate is not null)
        {
            accessRecords = accessRecords.Where(item => dbContext.Veiculos.Any(vehicle =>
                vehicle.Id == item.VeiculoId && vehicle.Placa == criteria.Plate));
        }

        if (criteria.DriverName is not null)
        {
            var pattern = $"%{EscapeLikePattern(criteria.DriverName)}%";
            accessRecords = accessRecords.Where(item => dbContext.Pessoas.Any(person =>
                person.Id == item.PessoaId &&
                EF.Functions.ILike(person.Nome, pattern, "\\")));
        }

        if (criteria.CategoryName is not null)
        {
            accessRecords = accessRecords.Where(item =>
                dbContext.CategoriasAcesso.Any(category =>
                    category.Id == item.CategoriaAcessoId &&
                    category.Nome == criteria.CategoryName));
        }

        if (criteria.Status.HasValue)
        {
            accessRecords = accessRecords.Where(item => item.Status == criteria.Status.Value);
        }

        var totalCount = await accessRecords.CountAsync(cancellationToken);
        var items = await ProjectRecords(accessRecords
                .OrderByDescending(item => item.DataHoraEntrada)
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

    public async Task<VehicleAccessCorrectionStoreResult> TryCorrectAsync(
        int accessRecordId,
        VehicleAccessCorrectionData correction,
        int actorUserId,
        DateTime correctedAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        try
        {
            var accessRecord = await dbContext.RegistrosAcesso
                .FromSqlInterpolated(
                    $"SELECT * FROM dbo.registros_acesso WHERE id = {accessRecordId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (accessRecord is null)
            {
                return new(
                    VehicleAccessCorrectionStoreStatus.NotFound,
                    null);
            }

            var category = await dbContext.CategoriasAcesso.SingleOrDefaultAsync(
                item => item.Nome == correction.CategoryName,
                cancellationToken);

            if (category is not null && !category.Ativo)
            {
                return new(
                    VehicleAccessCorrectionStoreStatus.Conflict,
                    null);
            }

            if (category is null)
            {
                category = new CategoriaAcesso(
                    correction.CategoryName,
                    "Categoria preliminar do MVP; sujeita à validação do cliente.");
                dbContext.CategoriasAcesso.Add(category);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            var previousCategoryId = accessRecord.CategoriaAcessoId;
            var previousObjective = accessRecord.Objetivo;
            var previousObservation = accessRecord.Observacao;
            var changed = accessRecord.CorrigirDados(
                category.Id,
                correction.Objective,
                correction.Observation,
                actorUserId,
                correctedAtUtc);

            if (!changed)
            {
                return new(
                    VehicleAccessCorrectionStoreStatus.Conflict,
                    null);
            }

            var changedFields = new List<string>(3);
            if (previousCategoryId != accessRecord.CategoriaAcessoId)
            {
                changedFields.Add("categoryName");
            }

            if (previousObjective != accessRecord.Objetivo)
            {
                changedFields.Add("objective");
            }

            if (previousObservation != accessRecord.Observacao)
            {
                changedFields.Add("observation");
            }

            dbContext.Auditorias.Add(CreateCorrectionAudit(
                accessRecord,
                actorUserId,
                correctedAtUtc,
                correction.Justification,
                changedFields));
            await dbContext.SaveChangesAsync(cancellationToken);

            var result = await ProjectRecords(dbContext.RegistrosAcesso
                    .AsNoTracking()
                    .Where(item => item.Id == accessRecordId))
                .SingleAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return new(
                VehicleAccessCorrectionStoreStatus.Success,
                result);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            })
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(
                VehicleAccessCorrectionStoreStatus.Conflict,
                null);
        }
    }

    public async Task<CloseVehicleAccessResult> TryCloseAsync(
        int accessRecordId,
        int actorUserId,
        DateTime exitAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        var accessRecord = await dbContext.RegistrosAcesso
            .FromSqlInterpolated(
                $"SELECT * FROM dbo.registros_acesso WHERE id = {accessRecordId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (accessRecord is null)
        {
            return new CloseVehicleAccessResult(
                CloseVehicleAccessStatus.NotFound,
                null);
        }

        if (accessRecord.Status != StatusRegistroAcesso.Aberto)
        {
            return new CloseVehicleAccessResult(
                CloseVehicleAccessStatus.Conflict,
                null);
        }

        accessRecord.RegistrarSaida(exitAtUtc, actorUserId);
        dbContext.Auditorias.Add(CreateExitAudit(accessRecord, actorUserId, exitAtUtc));
        await dbContext.SaveChangesAsync(cancellationToken);

        var result = await ProjectRecords(dbContext.RegistrosAcesso
                .AsNoTracking()
                .Where(item => item.Id == accessRecordId))
            .SingleAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
        return new CloseVehicleAccessResult(CloseVehicleAccessStatus.Success, result);
    }

    private static Auditoria CreateEntryAudit(
        RegistroAcesso accessRecord,
        int actorUserId,
        DateTime occurredAtUtc) =>
        new(
            occurredAtUtc,
            TipoAcaoAuditoria.Inclusao,
            nameof(RegistroAcesso),
            accessRecord.Id,
            actorUserId,
            dadosNovos: JsonSerializer.Serialize(new
            {
                status = StatusRegistroAcesso.Aberto.ToString(),
                vehicleId = accessRecord.VeiculoId,
                personId = accessRecord.PessoaId,
                accessCategoryId = accessRecord.CategoriaAcessoId
            }),
            detalhes: "Vehicle access entry registered.");

    private static Auditoria CreateExitAudit(
        RegistroAcesso accessRecord,
        int actorUserId,
        DateTime occurredAtUtc) =>
        new(
            occurredAtUtc,
            TipoAcaoAuditoria.Alteracao,
            nameof(RegistroAcesso),
            accessRecord.Id,
            actorUserId,
            dadosAnteriores: JsonSerializer.Serialize(new
            {
                status = StatusRegistroAcesso.Aberto.ToString()
            }),
            dadosNovos: JsonSerializer.Serialize(new
            {
                status = StatusRegistroAcesso.Encerrado.ToString(),
                exitAtUtc = occurredAtUtc
            }),
            detalhes: "Vehicle access exit registered.");

    private static Auditoria CreateCorrectionAudit(
        RegistroAcesso accessRecord,
        int actorUserId,
        DateTime occurredAtUtc,
        string justification,
        IReadOnlyCollection<string> changedFields) =>
        new(
            occurredAtUtc,
            TipoAcaoAuditoria.Alteracao,
            nameof(RegistroAcesso),
            accessRecord.Id,
            actorUserId,
            dadosNovos: JsonSerializer.Serialize(new
            {
                changedFields
            }),
            detalhes: justification);

    private IQueryable<VehicleAccessRecord> ProjectRecords(
        IQueryable<RegistroAcesso> accessRecords) =>
        from accessRecord in accessRecords
        join vehicle in dbContext.Veiculos.AsNoTracking()
            on accessRecord.VeiculoId equals vehicle.Id
        join person in dbContext.Pessoas.AsNoTracking()
            on accessRecord.PessoaId equals person.Id
        join category in dbContext.CategoriasAcesso.AsNoTracking()
            on accessRecord.CategoriaAcessoId equals category.Id
        select new VehicleAccessRecord(
            accessRecord.Id,
            vehicle.Id,
            vehicle.Placa!,
            person.Id,
            person.Nome,
            category.Nome,
            accessRecord.Objetivo,
            accessRecord.DataHoraEntrada,
            accessRecord.DataHoraSaida,
            accessRecord.Status.ToString(),
            accessRecord.CriadoPorId,
            accessRecord.AtualizadoPorId,
            accessRecord.Observacao);

    private static VehicleAccessRecord Map(
        RegistroAcesso accessRecord,
        Veiculo vehicle,
        Pessoa person,
        CategoriaAcesso category) =>
        new(
            accessRecord.Id,
            vehicle.Id,
            vehicle.Placa!,
            person.Id,
            person.Nome,
            category.Nome,
            accessRecord.Objetivo,
            accessRecord.DataHoraEntrada,
            accessRecord.DataHoraSaida,
            accessRecord.Status.ToString(),
            accessRecord.CriadoPorId,
            accessRecord.AtualizadoPorId,
            accessRecord.Observacao);

    private static VehicleAccessStoreRegistration Conflict() =>
        new(VehicleAccessStoreRegistrationStatus.Conflict, null);

    private static string EscapeLikePattern(string value) =>
        value.Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("%", "\\%", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal);
}
