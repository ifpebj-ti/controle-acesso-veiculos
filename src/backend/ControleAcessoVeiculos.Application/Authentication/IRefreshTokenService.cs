namespace ControleAcessoVeiculos.Application.Authentication;

public interface IRefreshTokenService
{
    RefreshToken Create();
    string ComputeHash(string token);
}

public sealed record RefreshToken(string Value, string Hash);
