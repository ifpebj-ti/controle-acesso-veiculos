using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using ControleAcessoVeiculos.API.Security;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace ControleAcessoVeiculos.IntegrationTests;

// A fictional provider exercises the real callback validation without Google or a database.
// Success here creates an external identity cookie, not an authorized application session.
public sealed class GoogleOidcSignedTokenTests
{
    [Theory]
    [InlineData("valid")]
    [InlineData("signature")]
    [InlineData("issuer")]
    [InlineData("audience")]
    [InlineData("expired")]
    [InlineData("nonce")]
    [InlineData("unverified-email")]
    public async Task CallbackValidatesSignedIdentityBeforeIssuingExternalCookie(string scenario)
    {
        using var signingRsa = RSA.Create(2048);
        using var wrongRsa = RSA.Create(2048);
        var key = new RsaSecurityKey(signingRsa) { KeyId = "fictional-provider-key" };
        var wrongKey = new RsaSecurityKey(wrongRsa) { KeyId = key.KeyId };
        using var backchannel = new TokenResponseHandler();
        using var factory = CreateFactory(key, backchannel);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false
        });

        using var start = await client.GetAsync("/auth/google/start", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Redirect, start.StatusCode);
        var query = QueryHelpers.ParseQuery(start.Headers.Location!.Query);
        var nonce = query["nonce"].ToString();
        Assert.False(string.IsNullOrEmpty(nonce));
        backchannel.CodeChallenge = query["code_challenge"].ToString();
        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            issuer: scenario == "issuer" ? "https://wrong.example.test" : "https://provider.example.test",
            audience: scenario == "audience" ? "wrong-client" : "fictional-client",
            claims:
            [
                new Claim("sub", "fictional-subject"),
                new Claim("email", "operator@example.test"),
                new Claim("email_verified", scenario == "unverified-email" ? "false" : "true", ClaimValueTypes.Boolean),
                new Claim("nonce", scenario == "nonce" ? "wrong-nonce" : nonce),
                new Claim("iat", EpochTime.GetIntDate(now.AddMinutes(-20)).ToString(System.Globalization.CultureInfo.InvariantCulture), ClaimValueTypes.Integer64)
            ],
            notBefore: now.AddMinutes(-20),
            expires: scenario == "expired" ? now.AddMinutes(-10) : now.AddMinutes(5),
            signingCredentials: new SigningCredentials(scenario == "signature" ? wrongKey : key, SecurityAlgorithms.RsaSha256));
        backchannel.IdToken = new JwtSecurityTokenHandler().WriteToken(token);

        var callback = QueryHelpers.AddQueryString("/signin-google", new Dictionary<string, string?>
        {
            ["code"] = "fictional-code",
            ["state"] = query["state"].ToString()
        });
        using var response = await client.GetAsync(callback, TestContext.Current.CancellationToken);

        Assert.Equal(1, backchannel.RequestCount);
        var cookies = response.Headers.TryGetValues("Set-Cookie", out var values) ? values.ToArray() : [];
        Assert.DoesNotContain(cookies, cookie => cookie.StartsWith("cav_refresh=", StringComparison.Ordinal));
        if (scenario == "valid")
        {
            Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
            Assert.Equal("/auth/google/complete", response.Headers.Location?.OriginalString);
            Assert.Contains(cookies, IsExternalIdentityCookie);
        }
        else
        {
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
            Assert.DoesNotContain(cookies, IsExternalIdentityCookie);
            var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
            Assert.DoesNotContain(backchannel.IdToken, body, StringComparison.Ordinal);
            Assert.DoesNotContain("operator@example.test", body, StringComparison.Ordinal);
            Assert.DoesNotContain("fictional-code", body, StringComparison.Ordinal);
        }
    }

    private static bool IsExternalIdentityCookie(string cookie) =>
        cookie.StartsWith("cav_google_external=", StringComparison.Ordinal) &&
        !cookie.StartsWith("cav_google_external=;", StringComparison.Ordinal);

    private static WebApplicationFactory<Program> CreateFactory(SecurityKey key, TokenResponseHandler handler) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("ConnectionStrings:DefaultConnection",
                "Host=127.0.0.1;Port=1;Database=unavailable;Username=test;Password=test;Timeout=1");
            builder.UseSetting("Authentication:Jwt:SigningKey", "integration-tests-only-signing-key-32-characters");
            builder.UseSetting("Authentication:Google:Enabled", "true");
            builder.UseSetting("Authentication:Google:ClientId", "fictional-client");
            builder.UseSetting("Authentication:Google:ClientSecret", "fictional-client-secret");
            builder.ConfigureServices(services => services.PostConfigure<OpenIdConnectOptions>(GoogleOidcOptions.Scheme, options =>
            {
                var configuration = new OpenIdConnectConfiguration
                {
                    Issuer = "https://provider.example.test",
                    AuthorizationEndpoint = "https://provider.example.test/authorize",
                    TokenEndpoint = "https://provider.example.test/token"
                };
                configuration.SigningKeys.Add(key);
                options.ConfigurationManager = new StaticConfigurationManager<OpenIdConnectConfiguration>(configuration);
                options.Backchannel = new HttpClient(handler, disposeHandler: false);
            }));
        });

    private sealed class TokenResponseHandler : HttpMessageHandler
    {
        public string IdToken { get; set; } = string.Empty;
        public string CodeChallenge { get; set; } = string.Empty;
        public int RequestCount { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal("https://provider.example.test/token", request.RequestUri?.AbsoluteUri);
            var form = QueryHelpers.ParseQuery(await request.Content!.ReadAsStringAsync(cancellationToken));
            Assert.Equal("authorization_code", form["grant_type"].ToString());
            Assert.Equal("fictional-code", form["code"].ToString());
            Assert.False(string.IsNullOrEmpty(form["code_verifier"]));
            var verifier = System.Text.Encoding.ASCII.GetBytes(form["code_verifier"].ToString());
            Assert.Equal(CodeChallenge, Base64UrlEncoder.Encode(SHA256.HashData(verifier)));
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = JsonContent.Create(new
                {
                    access_token = "fictional-provider-access-token",
                    token_type = "Bearer",
                    expires_in = 300,
                    id_token = IdToken
                })
            };
        }
    }
}
