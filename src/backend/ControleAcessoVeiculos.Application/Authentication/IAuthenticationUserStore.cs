namespace ControleAcessoVeiculos.Application.Authentication;

public interface IAuthenticationUserStore
{
    Task<AuthenticationUser?> FindByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
