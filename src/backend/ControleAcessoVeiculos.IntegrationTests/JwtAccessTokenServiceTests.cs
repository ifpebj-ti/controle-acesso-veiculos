using System.IdentityModel.Tokens.Jwt;
using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.Authentication;
using Microsoft.Extensions.Options;

namespace ControleAcessoVeiculos.IntegrationTests;

public sealed class JwtAccessTokenServiceTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void IssueCarriesExplicitMasterAdministratorClaim(bool isMasterAdministrator)
    {
        var service = new JwtAccessTokenService(
            Options.Create(new JwtOptions
            {
                Issuer = "test-issuer",
                Audience = "test-audience",
                SigningKey = "test-only-signing-key-with-32-characters"
            }),
            new FixedTimeProvider(
                new DateTimeOffset(2026, 10, 19, 12, 0, 0, TimeSpan.Zero)));

        var issued = service.Issue(
            7,
            "administrator@example.test",
            "Administrador",
            credentialVersion: 3,
            requiresPasswordChange: false,
            isMasterAdministrator);

        var token = new JwtSecurityTokenHandler().ReadJwtToken(issued.Value);
        var claim = Assert.Single(
            token.Claims,
            candidate =>
                candidate.Type == AuthenticationClaimTypes.IsMasterAdministrator);

        Assert.Equal(isMasterAdministrator.ToString(), claim.Value);
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
