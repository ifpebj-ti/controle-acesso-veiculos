namespace ControleAcessoVeiculos.Application.Authentication;

public sealed record LoginResult(
    bool IsSuccess,
    string? AccessToken,
    DateTime? ExpiresAtUtc,
    LoginUser? User)
{
    public static LoginResult InvalidCredentials() => new(false, null, null, null);

    public static LoginResult Success(AccessToken token, LoginUser user) =>
        new(true, token.Value, token.ExpiresAtUtc, user);
}

public sealed record LoginUser(int Id, string Email, string ProfileName);
