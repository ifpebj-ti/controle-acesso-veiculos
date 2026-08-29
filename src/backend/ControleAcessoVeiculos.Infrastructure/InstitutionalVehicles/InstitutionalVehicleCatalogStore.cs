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
}
