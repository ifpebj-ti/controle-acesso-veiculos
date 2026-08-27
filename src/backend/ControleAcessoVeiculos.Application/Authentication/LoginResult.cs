namespace ControleAcessoVeiculos.Application.Authentication;

public sealed record LoginResult(
    bool IsSuccess,
    string? AccessToken,
    DateTime? ExpiresAtUtc)
{
    public static LoginResult InvalidCredentials() => new(false, null, null);

    public static LoginResult Success(AccessToken token) =>
        new(true, token.Value, token.ExpiresAtUtc);
}
