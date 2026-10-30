using System.Net;
using ControleAcessoVeiculos.API.Security;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace ControleAcessoVeiculos.IntegrationTests;

// Exercise the application's real middleware with fictional provider metadata.
// These tests neither contact Google nor prove real-provider interoperability.
public sealed class GoogleOidcProtocolTests
{
    [Fact]
    public async Task ChallengeUsesCodePkceAndMinimalScopesWithoutExposingSecrets()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);

        using var response = await client.GetAsync("/auth/google/start", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        var location = Assert.IsType<Uri>(response.Headers.Location);
        Assert.Equal("provider.example.test", location.Host);
        var query = QueryHelpers.ParseQuery(location.Query);
        Assert.Equal("code", query["response_type"].ToString());
        Assert.Equal("S256", query["code_challenge_method"].ToString());
        Assert.Matches("^[A-Za-z0-9_-]{43}$", query["code_challenge"].ToString());
        Assert.Equal("https://localhost/signin-google", query["redirect_uri"].ToString());
        Assert.Equal(["email", "openid", "profile"], query["scope"].ToString().Split(' ').Order().ToArray());
        Assert.False(string.IsNullOrWhiteSpace(query["state"]));
        Assert.False(string.IsNullOrWhiteSpace(query["nonce"]));
        Assert.NotEqual(query["state"], query["nonce"]);
        Assert.False(query.ContainsKey("client_secret"));
        Assert.False(query.ContainsKey("code_verifier"));
        Assert.False(query.ContainsKey("access_token"));
        Assert.False(query.ContainsKey("id_token"));

        var cookies = response.Headers.GetValues("Set-Cookie").ToArray();
        Assert.Equal(2, cookies.Length);
        Assert.Contains(cookies, value => value.StartsWith(".AspNetCore.Correlation.", StringComparison.Ordinal));
        Assert.Contains(cookies, value => value.StartsWith(".AspNetCore.OpenIdConnect.Nonce.", StringComparison.Ordinal));
        Assert.All(cookies, value =>
        {
            Assert.Contains("secure", value, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("httponly", value, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("samesite=none", value, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("path=/signin-google", value, StringComparison.OrdinalIgnoreCase);
        });
        AssertNoBackchannel(factory);
    }

    [Theory]
    [InlineData("/signin-google?code=fictional-code")]
    [InlineData("/signin-google?code=fictional-code&state=invalid-state")]
    [InlineData("/signin-google?error=access_denied&state=invalid-state")]
    public async Task CallbackWithoutValidStateIsDeniedWithoutCreatingASession(string callback)
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);

        using var response = await client.GetAsync(callback, TestContext.Current.CancellationToken);

        await AssertDeniedAsync(response);
        AssertNoBackchannel(factory);
    }

    [Fact]
    public async Task ProtectedStateWithoutItsCorrelationCookieIsDenied()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory, handleCookies: false);
        using var start = await client.GetAsync("/auth/google/start", TestContext.Current.CancellationToken);
        var state = QueryHelpers.ParseQuery(start.Headers.Location!.Query)["state"].ToString();

        using var response = await client.GetAsync(
            QueryHelpers.AddQueryString("/signin-google?code=fictional-code", "state", state),
            TestContext.Current.CancellationToken);

        await AssertDeniedAsync(response);
        AssertNoBackchannel(factory);
    }

    [Fact]
    public async Task ProviderDenialAndReplayDoNotCreateAnApplicationSession()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);
        using var start = await client.GetAsync("/auth/google/start", TestContext.Current.CancellationToken);
        var state = QueryHelpers.ParseQuery(start.Headers.Location!.Query)["state"].ToString();
        var callback = QueryHelpers.AddQueryString("/signin-google?error=access_denied", "state", state);

        using var denied = await client.GetAsync(callback, TestContext.Current.CancellationToken);
        await AssertDeniedAsync(denied);
        using var replayed = await client.GetAsync(callback, TestContext.Current.CancellationToken);
        await AssertDeniedAsync(replayed);
        AssertNoBackchannel(factory);
    }

    [Fact]
    public async Task CompletionWithoutExternalIdentityReturnsOnlyDeniedStatus()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);

        using var response = await client.GetAsync("/auth/google/complete", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/login?status=denied", response.Headers.Location?.OriginalString);
        AssertNoApplicationSession(response);
        AssertNoBackchannel(factory);
    }

    private static async Task AssertDeniedAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("Não foi possível concluir", body);
        Assert.DoesNotContain("invalid-state", body, StringComparison.Ordinal);
        Assert.DoesNotContain("fictional-code", body, StringComparison.Ordinal);
        Assert.DoesNotContain("fictional-client-secret", body, StringComparison.Ordinal);
        AssertNoApplicationSession(response);
    }

    private static void AssertNoApplicationSession(HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var cookies)) return;
        Assert.DoesNotContain(cookies, cookie => cookie.StartsWith("cav_refresh=", StringComparison.Ordinal));
        Assert.DoesNotContain(cookies, cookie =>
            cookie.StartsWith("cav_google_external=", StringComparison.Ordinal) &&
            !cookie.StartsWith("cav_google_external=;", StringComparison.Ordinal));
    }

    private static HttpClient CreateClient(WebApplicationFactory<Program> factory, bool handleCookies = true) =>
        factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false,
            HandleCookies = handleCookies
        });

    private static WebApplicationFactory<Program> CreateFactory() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            // No request in this suite should reach the database.
            builder.UseSetting("ConnectionStrings:DefaultConnection",
                "Host=127.0.0.1;Port=1;Database=unavailable;Username=test;Password=test;Timeout=1");
            builder.UseSetting("Authentication:Jwt:SigningKey", "integration-tests-only-signing-key-32-characters");
            builder.UseSetting("Authentication:Google:Enabled", "true");
            builder.UseSetting("Authentication:Google:ClientId", "fictional-client");
            builder.UseSetting("Authentication:Google:ClientSecret", "fictional-client-secret");
            builder.ConfigureServices(services =>
            {
                var guard = new RejectBackchannelHandler();
                services.AddSingleton(guard);
                services.PostConfigure<OpenIdConnectOptions>(GoogleOidcOptions.Scheme, options =>
                {
                    options.ConfigurationManager = new StaticConfigurationManager<OpenIdConnectConfiguration>(
                        new OpenIdConnectConfiguration
                        {
                            Issuer = "https://provider.example.test",
                            AuthorizationEndpoint = "https://provider.example.test/authorize",
                            TokenEndpoint = "https://provider.example.test/token"
                        });
                    options.Backchannel = new HttpClient(guard);
                });
            });
        });

    private static void AssertNoBackchannel(WebApplicationFactory<Program> factory) =>
        Assert.Equal(0, factory.Services.GetRequiredService<RejectBackchannelHandler>().RequestCount);

    private sealed class RejectBackchannelHandler : HttpMessageHandler
    {
        public int RequestCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            throw new InvalidOperationException("These protocol rejection tests must not contact a provider.");
        }
    }
}
