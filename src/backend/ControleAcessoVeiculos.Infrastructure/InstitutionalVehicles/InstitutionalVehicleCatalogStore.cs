using System.Text.Json;
using ControleAcessoVeiculos.Application.InstitutionalVehicles;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ControleAcessoVeiculos.Infrastructure.InstitutionalVehicles;

public sealed class InstitutionalVehicleCatalogStore(
    ControleAcessoVeiculosDbContext dbContext)
    : IInstitutionalVehicleCatalogStore
{
    public async Task<InstitutionalVehicleStoreRegistration> TryCreateAsync(
        InstitutionalVehicleData vehicle,
        int actorUserId,
        DateTime createdAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        try
        {
            var entity = new Veiculo(
                vehicle.Plate,
                vehicle.VehicleType,
                vehicle.Identification,
                ehInstitucional: true,
                vehicle.Brand,
                vehicle.Model,
                vehicle.Color,
                vehicle.Year);
            dbContext.Veiculos.Add(entity);

            await dbContext.SaveChangesAsync(cancellationToken);

            dbContext.Auditorias.Add(new Auditoria(
                createdAtUtc,
                TipoAcaoAuditoria.Inclusao,
                nameof(Veiculo),
                entity.Id,
                actorUserId,
                dadosNovos: JsonSerializer.Serialize(new
                {
                    institutional = true,
                    hasPlate = entity.Placa is not null,
                    hasIdentification = entity.IdentificacaoVeiculo is not null
                }),
                detalhes: "Institutional vehicle created."));

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new InstitutionalVehicleStoreRegistration(
                InstitutionalVehicleStoreRegistrationStatus.Success,
                Map(entity));
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            })
        {
            await transaction.RollbackAsync(cancellationToken);
            return new InstitutionalVehicleStoreRegistration(
                InstitutionalVehicleStoreRegistrationStatus.Conflict,
                null);
        }
    }

    public async Task<IReadOnlyList<InstitutionalVehicleRecord>> ListActiveAsync(
        CancellationToken cancellationToken) =>
        await dbContext.Veiculos
            .AsNoTracking()
            .Where(vehicle => vehicle.EhInstitucional && vehicle.Ativo)
            .OrderBy(vehicle => vehicle.IdentificacaoVeiculo ?? vehicle.Placa)
            .ThenBy(vehicle => vehicle.Id)
            .Select(vehicle => new InstitutionalVehicleRecord(
                vehicle.Id,
                vehicle.Placa,
                vehicle.IdentificacaoVeiculo,
                vehicle.Tipo,
                vehicle.Marca,
                vehicle.Modelo,
                vehicle.Cor,
                vehicle.Ano,
                vehicle.DataCriacao))
            .ToListAsync(cancellationToken);

    public async Task<InstitutionalVehicleStoreUpdate> TryUpdateAsync(
        int vehicleId,
        InstitutionalVehicleData vehicle,
        int actorUserId,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        try
        {
            var entity = await LockVehicleAsync(vehicleId, cancellationToken);

            if (entity is null || !entity.EhInstitucional)
            {
                return new(InstitutionalVehicleStoreUpdateStatus.NotFound, null);
            }

            var changedFields = GetChangedFields(entity, vehicle);
            var changed = entity.AtualizarDados(
                vehicle.Plate,
                vehicle.VehicleType,
                vehicle.Identification,
                vehicle.Brand,
                vehicle.Model,
                vehicle.Color,
                vehicle.Year,
                updatedAtUtc);

            if (!changed)
            {
                return new(InstitutionalVehicleStoreUpdateStatus.Success, Map(entity));
            }

            dbContext.Auditorias.Add(new Auditoria(
                updatedAtUtc,
                TipoAcaoAuditoria.Alteracao,
                nameof(Veiculo),
                entity.Id,
                actorUserId,
                dadosNovos: JsonSerializer.Serialize(new { changedFields }),
                detalhes: "Institutional vehicle updated."));
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new(InstitutionalVehicleStoreUpdateStatus.Success, Map(entity));
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            })
        {
            await transaction.RollbackAsync(cancellationToken);
            return new(InstitutionalVehicleStoreUpdateStatus.Conflict, null);
        }
    }

    public async Task<InstitutionalVehicleStoreStateStatus> TrySetActiveAsync(
        int vehicleId,
        bool active,
        int actorUserId,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);
        var entity = await LockVehicleAsync(vehicleId, cancellationToken);

        if (entity is null || !entity.EhInstitucional)
        {
            return InstitutionalVehicleStoreStateStatus.NotFound;
        }

        if (entity.Ativo == active)
        {
            return InstitutionalVehicleStoreStateStatus.Conflict;
        }

        var previousActive = entity.Ativo;
        if (active)
        {
            entity.Reativar(updatedAtUtc);
        }
        else
        {
            entity.Desativar(updatedAtUtc);
        }

        dbContext.Auditorias.Add(new Auditoria(
            updatedAtUtc,
            TipoAcaoAuditoria.Alteracao,
            nameof(Veiculo),
            entity.Id,
            actorUserId,
            dadosAnteriores: JsonSerializer.Serialize(new { active = previousActive }),
            dadosNovos: JsonSerializer.Serialize(new { active }),
            detalhes: active
                ? "Institutional vehicle reactivated."
                : "Institutional vehicle deactivated."));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return InstitutionalVehicleStoreStateStatus.Success;
    }

    private static InstitutionalVehicleRecord Map(Veiculo vehicle) =>
        new(
            vehicle.Id,
            vehicle.Placa,
            vehicle.IdentificacaoVeiculo,
            vehicle.Tipo,
            vehicle.Marca,
            vehicle.Modelo,
            vehicle.Cor,
            vehicle.Ano,
            vehicle.DataCriacao);

    private Task<Veiculo?> LockVehicleAsync(
        int vehicleId,
        CancellationToken cancellationToken) =>
        dbContext.Veiculos
            .FromSqlInterpolated(
                $"SELECT * FROM dbo.veiculos WHERE id = {vehicleId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

    private static IReadOnlyList<string> GetChangedFields(
        Veiculo entity,
        InstitutionalVehicleData vehicle)
    {
        var changedFields = new List<string>();
        AddIfChanged(changedFields, "plate", entity.Placa, vehicle.Plate);
        AddIfChanged(
            changedFields,
            "identification",
            entity.IdentificacaoVeiculo,
            vehicle.Identification);
        AddIfChanged(changedFields, "vehicleType", entity.Tipo, vehicle.VehicleType);
        AddIfChanged(changedFields, "brand", entity.Marca, vehicle.Brand);
        AddIfChanged(changedFields, "model", entity.Modelo, vehicle.Model);
        AddIfChanged(changedFields, "color", entity.Cor, vehicle.Color);

        if (entity.Ano != vehicle.Year)
        {
            changedFields.Add("year");
        }

        return changedFields;
    }

    private static void AddIfChanged(
        ICollection<string> changedFields,
        string field,
        string? currentValue,
        string? newValue)
    {
        if (currentValue != newValue)
        {
            changedFields.Add(field);
        }
    }
}
