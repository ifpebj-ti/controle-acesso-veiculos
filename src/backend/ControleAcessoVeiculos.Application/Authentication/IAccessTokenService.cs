namespace ControleAcessoVeiculos.Application.Authentication;

public interface IAccessTokenService
{
    AccessToken Issue(int userId, string email, string profileName);
}

public sealed record AccessToken(string Value, DateTime ExpiresAtUtc);
