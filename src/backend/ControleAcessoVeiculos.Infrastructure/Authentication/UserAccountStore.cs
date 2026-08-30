using System.Text.Json;
using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ControleAcessoVeiculos.Infrastructure.Authentication;

public sealed class UserAccountStore(ControleAcessoVeiculosDbContext dbContext)
    : IUserAccountStore
{
    public Task<bool> HasAnyUserAsync(CancellationToken cancellationToken) =>
        dbContext.Usuarios.AnyAsync(cancellationToken);

    public async Task<CreatedUserAccount?> TryCreateAsync(
        string name,
        string normalizedEmail,
        string passwordHash,
        string profileName,
        AccountCreationAudit audit,
        CancellationToken cancellationToken)
    {
        var emailAlreadyExists = await dbContext.Usuarios.AnyAsync(
                user => user.Email == normalizedEmail,
                cancellationToken) ||
            await dbContext.Pessoas.AnyAsync(
                person => person.Email == normalizedEmail,
                cancellationToken);

        if (emailAlreadyExists)
        {
            return null;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        try
        {
            var profile = await dbContext.Perfis.SingleOrDefaultAsync(
                item => item.Nome == profileName,
                cancellationToken);

            if (profile is null)
            {
                profile = new Perfil(
                    profileName,
                    "Perfil preliminar do MVP; permissões sujeitas à validação do cliente.");
                dbContext.Perfis.Add(profile);
            }
            else if (!profile.Ativo)
            {
                return null;
            }

            var person = new Pessoa(name, email: normalizedEmail);
            dbContext.Pessoas.Add(person);
            await dbContext.SaveChangesAsync(cancellationToken);

            var user = new Usuario(
                normalizedEmail,
                passwordHash,
                person.Id,
                profile.Id);
            dbContext.Usuarios.Add(user);
            await dbContext.SaveChangesAsync(cancellationToken);

            dbContext.Auditorias.Add(new Auditoria(
                audit.OccurredAtUtc,
                TipoAcaoAuditoria.Inclusao,
                nameof(Usuario),
                user.Id,
                audit.ActorUserId,
                dadosNovos: JsonSerializer.Serialize(new
                {
                    active = true,
                    profileName = profile.Nome,
                    origin = audit.Origin.ToString()
                }),
                detalhes: audit.Origin == AccountCreationOrigin.Bootstrap
                    ? "Initial administrator account bootstrapped."
                    : "User account created by an administrator."));
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new CreatedUserAccount(user.Id, user.Email, profile.Nome);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            })
        {
            await transaction.RollbackAsync(cancellationToken);
            return null;
        }
    }

    public async Task<PagedUserAccountResult> SearchAsync(
        UserAccountSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        var query =
            from user in dbContext.Usuarios.AsNoTracking()
            join person in dbContext.Pessoas.AsNoTracking()
                on user.PessoaId equals person.Id
            join profile in dbContext.Perfis.AsNoTracking()
                on user.PerfilId equals profile.Id
            select new { User = user, Person = person, Profile = profile };

        if (criteria.Search is not null)
        {
            query = query.Where(item =>
                item.User.Email.ToLower().Contains(criteria.Search) ||
                item.Person.Nome.ToLower().Contains(criteria.Search));
        }

        if (criteria.Active.HasValue)
        {
            query = query.Where(item => item.User.Ativo == criteria.Active.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(item => item.Person.Nome)
            .ThenBy(item => item.User.Id)
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .Select(item => new UserAccountRecord(
                item.User.Id,
                item.Person.Nome,
                item.User.Email,
                item.Profile.Nome,
                item.User.Ativo,
                item.User.DataCriacao,
                item.User.DataAlteracao,
                item.User.BloqueadoAte))
            .ToListAsync(cancellationToken);

        var totalPages = totalCount == 0
            ? 0
            : ((totalCount - 1) / criteria.PageSize) + 1;

        return new PagedUserAccountResult(
            items,
            criteria.Page,
            criteria.PageSize,
            totalCount,
            totalPages);
    }

    public async Task<UserAccountStoreStateStatus> TrySetActiveAsync(
        int userId,
        bool active,
        int actorUserId,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync(
            "SELECT pg_advisory_xact_lock(73000173)",
            cancellationToken);

        var user = await LockUserAsync(userId, cancellationToken);
        if (user is null)
        {
            return UserAccountStoreStateStatus.NotFound;
        }

        if (user.Ativo == active)
        {
            return UserAccountStoreStateStatus.Conflict;
        }

        if (!active && userId == actorUserId)
        {
            return UserAccountStoreStateStatus.LastAdministrator;
        }

        var profileName = await dbContext.Perfis
            .Where(profile => profile.Id == user.PerfilId)
            .Select(profile => profile.Nome)
            .SingleAsync(cancellationToken);

        if (!active && profileName == ProfileNames.Administrator)
        {
            var activeAdministratorCount = await dbContext.Usuarios
                .Where(candidate => candidate.Ativo)
                .Join(
                    dbContext.Perfis.Where(profile =>
                        profile.Ativo && profile.Nome == ProfileNames.Administrator),
                    candidate => candidate.PerfilId,
                    profile => profile.Id,
                    (_, _) => 1)
                .CountAsync(cancellationToken);

            if (activeAdministratorCount <= 1)
            {
                return UserAccountStoreStateStatus.LastAdministrator;
            }
        }

        var previousActive = user.Ativo;
        if (active)
        {
            user.Reativar(updatedAtUtc);
        }
        else
        {
            user.Desativar(updatedAtUtc);
        }

        dbContext.Auditorias.Add(new Auditoria(
            updatedAtUtc,
            TipoAcaoAuditoria.Alteracao,
            nameof(Usuario),
            user.Id,
            actorUserId,
            dadosAnteriores: JsonSerializer.Serialize(new { active = previousActive }),
            dadosNovos: JsonSerializer.Serialize(new { active }),
            detalhes: active ? "User account reactivated." : "User account deactivated."));

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return UserAccountStoreStateStatus.Success;
    }

    private Task<Usuario?> LockUserAsync(
        int userId,
        CancellationToken cancellationToken) =>
        dbContext.Usuarios
            .FromSqlInterpolated(
                $"SELECT * FROM dbo.usuarios WHERE id = {userId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
}
