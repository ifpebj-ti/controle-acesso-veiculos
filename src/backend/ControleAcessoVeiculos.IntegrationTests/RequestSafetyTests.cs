using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ControleAcessoVeiculos.API.Middleware;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class RequestSafetyTests(ApiFactory factory)
{
    [Fact]
    public async Task ResponseShouldContainServerGeneratedCorrelationId()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
        var value = Assert.Single(response.Headers.GetValues(
            RequestSafetyMiddleware.CorrelationIdHeaderName));
        Assert.True(Guid.TryParseExact(value, "D", out _));
    }

    [Fact]
    public async Task ValidCorrelationIdShouldBeNormalizedAndReturned()
    {
        using var client = factory.CreateClient();
        var correlationId = Guid.NewGuid();
        client.DefaultRequestHeaders.Add(
            RequestSafetyMiddleware.CorrelationIdHeaderName,
            correlationId.ToString("B").ToUpperInvariant());

        var response = await client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
        Assert.Equal(
            correlationId.ToString("D"),
            Assert.Single(response.Headers.GetValues(
                RequestSafetyMiddleware.CorrelationIdHeaderName)));
    }

    [Fact]
    public async Task InvalidCorrelationIdShouldBeReplaced()
    {
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(
            RequestSafetyMiddleware.CorrelationIdHeaderName,
            "invalid-correlation-id");

        var response = await client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
        var value = Assert.Single(response.Headers.GetValues(
            RequestSafetyMiddleware.CorrelationIdHeaderName));
        Assert.NotEqual("invalid-correlation-id", value);
        Assert.True(Guid.TryParseExact(value, "D", out _));
    }

    [Fact]
    public async Task OversizedPayloadShouldReturnProblemDetails()
    {
        factory.RequestLogs.Clear();
        using var client = factory.CreateClient();
        using var content = new StringContent(
            new string('a', RequestSafetyMiddleware.MaximumRequestBodySize + 1),
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/auth/login", content);
        var body = await ReadProblemDetailsAsync(response);

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
        Assert.Equal(413, body.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(
            GetCorrelationId(response),
            body.RootElement.GetProperty("correlationId").GetString());
        Assert.False(string.IsNullOrWhiteSpace(
            body.RootElement.GetProperty("traceId").GetString()));
        Assert.Contains(
            factory.RequestLogs.Messages,
            message => message.Contains("413", StringComparison.Ordinal));
    }

    [Fact]
    public async Task RequestLogShouldExcludeQueryAndAuthorizationHeader()
    {
        factory.RequestLogs.Clear();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", "secret-test-token");

        var response = await client.GetAsync("/health?document=secret-test-document");

        response.EnsureSuccessStatusCode();
        Assert.Contains(
            factory.RequestLogs.Messages,
            message => message.Contains("GET /health", StringComparison.Ordinal));
        Assert.DoesNotContain(
            factory.RequestLogs.Messages,
            message => message.Contains("secret-test", StringComparison.Ordinal));
    }

    [Fact]
    public async Task UnauthorizedResponseShouldUseCorrelatedProblemDetails()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/access-records/open");
        var body = await ReadProblemDetailsAsync(response);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(401, body.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(
            GetCorrelationId(response),
            body.RootElement.GetProperty("correlationId").GetString());
    }

    [Fact]
    public async Task UnhandledExceptionShouldNotExposeInternalDetails()
    {
        factory.RequestLogs.Clear();
        using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var tokenService = scope.ServiceProvider.GetRequiredService<IAccessTokenService>();
        var accessToken = tokenService.Issue(
            1,
            "request-safety@example.test",
            ProfileNames.Administrator);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken.Value);

        var response = await client.GetAsync("/__tests/unhandled-error");
        var responseText = await response.Content.ReadAsStringAsync();
        using var body = JsonDocument.Parse(responseText);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.StartsWith("application/problem+json", response.Content.Headers.ContentType?.ToString());
        Assert.Equal(500, body.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(
            GetCorrelationId(response),
            body.RootElement.GetProperty("correlationId").GetString());
        Assert.DoesNotContain("sensitive-database-password", responseText, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("InvalidOperationException", responseText, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("stack", responseText, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(
            factory.RequestLogs.Messages,
            message => message.Contains(
                "sensitive-database-password",
                StringComparison.OrdinalIgnoreCase));
        Assert.Contains(
            factory.RequestLogs.Messages,
            message => message.Contains(
                typeof(InvalidOperationException).FullName!,
                StringComparison.Ordinal));
    }

    private static async Task<JsonDocument> ReadProblemDetailsAsync(
        HttpResponseMessage response)
    {
        Assert.StartsWith(
            "application/problem+json",
            response.Content.Headers.ContentType?.ToString());
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    }

    private static string GetCorrelationId(HttpResponseMessage response) =>
        Assert.Single(response.Headers.GetValues(
            RequestSafetyMiddleware.CorrelationIdHeaderName));
}
