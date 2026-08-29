using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ControleAcessoVeiculos.API.Security;

public static class AuthenticatedUser
{
    public static bool TryGetId(ClaimsPrincipal principal, out int userId) =>
        int.TryParse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub), out userId) &&
        userId > 0;
}
