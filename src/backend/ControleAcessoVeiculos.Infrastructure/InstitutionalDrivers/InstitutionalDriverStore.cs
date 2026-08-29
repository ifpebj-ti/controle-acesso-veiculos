using System.Text.Json;
using ControleAcessoVeiculos.Application.InstitutionalDrivers;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ControleAcessoVeiculos.Infrastructure.InstitutionalDrivers;

public sealed class InstitutionalDriverStore(
    ControleAcessoVeiculosDbContext dbContext) : IInstitutionalDriverStore
{
    public async Task<InstitutionalDriverStoreAuthorization> TryAuthorizeAsync(
        InstitutionalDriverData driver,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        try
        {
            var person = driver.DocumentNumber is null
                ? null
                : await dbContext.Pessoas.SingleOrDefaultAsync(
                    item => item.DocumentoTipo == driver.DocumentType &&
                        item.DocumentoNumero == driver.DocumentNumber,
                    cancellationToken);

            if (person is not null && !person.Ativo)
            {
                return Conflict();
            }

            var personCreated = person is null;
            if (personCreated)
            {
                person = new Pessoa(driver.Name, driver.DocumentType, driver.DocumentNumber);
                dbContext.Pessoas.Add(person);
                await dbContext.SaveChangesAsync(cancellationToken);

                dbContext.Auditorias.Add(new Auditoria(
                    occurredAtUtc,
                    TipoAcaoAuditoria.Inclusao,
                    nameof(Pessoa),
                    person.Id,
                    actorUserId,
                    dadosNovos: JsonSerializer.Serialize(new
                    {
                        source = "institutional-driver-authorization"
                    }),
                    detalhes: "Person created for institutional driver authorization."));
            }

            var authorization = await dbContext.MotoristasInstitucionais
                .FromSqlInterpolated(
                    $"SELECT * FROM dbo.motoristas_institucionais WHERE pessoa_id = {person!.Id} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            var action = TipoAcaoAuditoria.Inclusao;
            if (authorization is null)
            {
                authorization = new MotoristaInstitucional(
                    person.Id,
                    actorUserId,
                    occurredAtUtc);
                dbContext.MotoristasInstitucionais.Add(authorization);
            }
            else if (authorization.Ativo)
            {
                return Conflict();
            }
            else
            {
                authorization.Reativar(occurredAtUtc, actorUserId);
                action = TipoAcaoAuditoria.Alteracao;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            dbContext.Auditorias.Add(CreateAuthorizationAudit(
                authorization,
                actorUserId,
                occurredAtUtc,
                action,
                active: true));
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new InstitutionalDriverStoreAuthorization(
                InstitutionalDriverStoreAuthorizationStatus.Success,
                Map(authorization, person));
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

    public async Task<IReadOnlyList<InstitutionalDriverRecord>> ListActiveAsync(
        CancellationToken cancellationToken) =>
        await (from authorization in dbContext.MotoristasInstitucionais.AsNoTracking()
               join person in dbContext.Pessoas.AsNoTracking()
                   on authorization.PessoaId equals person.Id
               where authorization.Ativo && person.Ativo
               orderby person.Nome, authorization.Id
               select new InstitutionalDriverRecord(
                   authorization.Id,
                   person.Id,
                   person.Nome,
                   authorization.DataCriacao,
                   authorization.CriadoPorId,
                   authorization.DataAlteracao,
                   authorization.AtualizadoPorId))
            .ToListAsync(cancellationToken);

    public async Task<DeactivateInstitutionalDriverResult> TryDeactivateAsync(
        int driverId,
        int actorUserId,
        DateTime occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        var authorization = await dbContext.MotoristasInstitucionais
            .FromSqlInterpolated(
                $"SELECT * FROM dbo.motoristas_institucionais WHERE id = {driverId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (authorization is null)
        {
            return new(DeactivateInstitutionalDriverStatus.NotFound);
        }

        if (!authorization.Ativo)
        {
            return new(DeactivateInstitutionalDriverStatus.Conflict);
        }

        authorization.Desativar(occurredAtUtc, actorUserId);
        dbContext.Auditorias.Add(CreateAuthorizationAudit(
            authorization,
            actorUserId,
            occurredAtUtc,
            TipoAcaoAuditoria.Alteracao,
            active: false));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new(DeactivateInstitutionalDriverStatus.Success);
    }

    private static Auditoria CreateAuthorizationAudit(
        MotoristaInstitucional authorization,
        int actorUserId,
        DateTime occurredAtUtc,
        TipoAcaoAuditoria action,
        bool active) =>
        new(
            occurredAtUtc,
            action,
            nameof(MotoristaInstitucional),
            authorization.Id,
            actorUserId,
            dadosAnteriores: action == TipoAcaoAuditoria.Alteracao
                ? JsonSerializer.Serialize(new { active = !active })
                : null,
            dadosNovos: JsonSerializer.Serialize(new
            {
                personId = authorization.PessoaId,
                active
            }),
            detalhes: active
                ? "Institutional driver authorization granted."
                : "Institutional driver authorization revoked.");

    private static InstitutionalDriverRecord Map(
        MotoristaInstitucional authorization,
        Pessoa person) =>
        new(
            authorization.Id,
            person.Id,
            person.Nome,
            authorization.DataCriacao,
            authorization.CriadoPorId,
            authorization.DataAlteracao,
            authorization.AtualizadoPorId);

    private static InstitutionalDriverStoreAuthorization Conflict() =>
        new(InstitutionalDriverStoreAuthorizationStatus.Conflict, null);
}
