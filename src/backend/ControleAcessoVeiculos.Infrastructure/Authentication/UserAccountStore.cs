using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Domain.Entities;
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
}
