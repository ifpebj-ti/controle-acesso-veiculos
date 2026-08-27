using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.Authentication;

public sealed class AuthenticationUserStore(ControleAcessoVeiculosDbContext dbContext)
    : IAuthenticationUserStore
{
    public async Task<AuthenticationUser?> FindByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Usuarios.SingleOrDefaultAsync(
            candidate => candidate.Email == normalizedEmail,
            cancellationToken);

        if (user is null)
        {
            return null;
        }

        var profile = await dbContext.Perfis
            .Where(candidate => candidate.Id == user.PerfilId)
            .Select(candidate => new { candidate.Nome, candidate.Ativo })
            .SingleAsync(cancellationToken);

        return new AuthenticationUser(user, profile.Nome, profile.Ativo);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
