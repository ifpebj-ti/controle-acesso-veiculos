using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ControleAcessoVeiculos.API.Middleware;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class RateLimitingTests(ApiFactory factory)
{
    [Fact]
    public async Task LoginLimitShouldReturnCorrelatedProblemDetails()
    {
        using var limitedFactory = CreateLimitedFactory(
            globalPermitLimit: 100,
            loginPermitLimit: 2);
        using var client = limitedFactory.CreateClient();

        for (var attempt = 0; attempt < 2; attempt++)
        {
            var response = await SendInvalidLoginAsync(client);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        var rejected = await SendInvalidLoginAsync(client);
        var body = JsonDocument.Parse(await rejected.Content.ReadAsStringAsync());

        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
        Assert.StartsWith(
            "application/problem+json",
            rejected.Content.Headers.ContentType?.ToString());
        Assert.NotNull(rejected.Headers.RetryAfter?.Delta);
        Assert.Equal(429, body.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(
            GetCorrelationId(rejected),
            body.RootElement.GetProperty("correlationId").GetString());
        Assert.False(string.IsNullOrWhiteSpace(
            body.RootElement.GetProperty("traceId").GetString()));
        Assert.DoesNotContain(
            "missing-rate-limit-user",
            await rejected.Content.ReadAsStringAsync(),
            StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task HealthChecksShouldRemainAvailableAfterGlobalLimit()
    {
        using var limitedFactory = CreateLimitedFactory(
            globalPermitLimit: 1,
            loginPermitLimit: 100);
        using var client = limitedFactory.CreateClient();

        var first = await client.GetAsync("/access-records/open");
        var rejected = await client.GetAsync("/access-records/open");
        var health = await client.GetAsync("/health/live");

        Assert.Equal(HttpStatusCode.Unauthorized, first.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
        health.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task AuthenticatedUsersShouldHaveIndependentGlobalPartitions()
    {
        using var limitedFactory = CreateLimitedFactory(
            globalPermitLimit: 1,
            loginPermitLimit: 100);
        var firstToken = IssueToken(limitedFactory, 101);
        var secondToken = IssueToken(limitedFactory, 202);
        using var firstClient = CreateAuthenticatedClient(limitedFactory, firstToken);
        using var secondClient = CreateAuthenticatedClient(limitedFactory, secondToken);

        var firstResponse = await firstClient.GetAsync("/weatherforecast");
        var firstRejected = await firstClient.GetAsync("/weatherforecast");
        var secondResponse = await secondClient.GetAsync("/weatherforecast");

        firstResponse.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.TooManyRequests, firstRejected.StatusCode);
        secondResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public void InvalidLimitsShouldFailDuringStartup()
    {
        using var invalidFactory = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("RateLimiting:GlobalPermitLimit", "0"));

        var exception = Assert.Throws<InvalidOperationException>(
            invalidFactory.CreateClient);

        Assert.Contains(
            "RateLimiting:GlobalPermitLimit",
            exception.Message,
            StringComparison.Ordinal);
    }

    private WebApplicationFactory<Program> CreateLimitedFactory(
        int globalPermitLimit,
        int loginPermitLimit) =>
        factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting(
                "RateLimiting:GlobalPermitLimit",
                globalPermitLimit.ToString());
            builder.UseSetting("RateLimiting:GlobalWindowSeconds", "60");
            builder.UseSetting(
                "RateLimiting:LoginPermitLimit",
                loginPermitLimit.ToString());
            builder.UseSetting("RateLimiting:LoginWindowSeconds", "60");
        });

    private static async Task<HttpResponseMessage> SendInvalidLoginAsync(
        HttpClient client) =>
        await client.PostAsJsonAsync("/auth/login", new
        {
            email = "missing-rate-limit-user@example.test",
            password = "Invalid-test-password-123!"
        });

    private static string IssueToken(
        WebApplicationFactory<Program> limitedFactory,
        int userId)
    {
        using var scope = limitedFactory.Services.CreateScope();
        var tokenService = scope.ServiceProvider.GetRequiredService<IAccessTokenService>();

        return tokenService.Issue(
            userId,
            $"rate-limit-{userId}@example.test",
            ProfileNames.Administrator).Value;
    }

    private static HttpClient CreateAuthenticatedClient(
        WebApplicationFactory<Program> limitedFactory,
        string token)
    {
        var client = limitedFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static string GetCorrelationId(HttpResponseMessage response) =>
        Assert.Single(response.Headers.GetValues(
            RequestSafetyMiddleware.CorrelationIdHeaderName));
}
