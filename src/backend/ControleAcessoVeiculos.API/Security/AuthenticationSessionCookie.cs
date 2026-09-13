using Microsoft.Extensions.Options;

namespace ControleAcessoVeiculos.API.Security;

public sealed class AuthenticationSessionCookie(
    IOptions<AuthenticationSessionOptions> options,
    IWebHostEnvironment environment)
{
    private readonly AuthenticationSessionOptions _options = options.Value;

    public void Append(HttpResponse response, string value, DateTime expiresAtUtc) =>
        response.Cookies.Append(
            _options.RefreshCookieName,
            value,
            CreateOptions(expiresAtUtc));

    public bool TryRead(HttpRequest request, out string value) =>
        request.Cookies.TryGetValue(_options.RefreshCookieName, out value!);

    public void Delete(HttpResponse response) =>
        response.Cookies.Delete(
            _options.RefreshCookieName,
            CreateOptions(DateTime.UnixEpoch));

    private CookieOptions CreateOptions(DateTime expiresAtUtc) => new()
    {
        HttpOnly = true,
        Secure = !environment.IsDevelopment() &&
            !environment.IsEnvironment("LocalContainer") &&
            !environment.IsEnvironment("Testing"),
        SameSite = SameSiteMode.Strict,
        Path = "/auth",
        IsEssential = true,
        Expires = new DateTimeOffset(expiresAtUtc, TimeSpan.Zero)
    };
}
