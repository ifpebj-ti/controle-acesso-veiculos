using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ControleAcessoVeiculos.Application.AdministrativeReports;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class TechnicalEndpointsTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient(new()
    {
        AllowAutoRedirect = false
    });

    [Fact]
    public async Task HealthReturnsHealthyStatus()
    {
        var response = await _client.GetAsync("/health", TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>(cancellationToken: TestContext.Current.CancellationToken);

        Assert.NotNull(body);
        Assert.Equal("Healthy", body.Status);
        Assert.NotEqual(default, body.Timestamp);
    }

    [Theory]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public async Task HealthEndpointsReturnHealthyStatus(string endpoint)
    {
        var response = await _client.GetAsync(endpoint, TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>(cancellationToken: TestContext.Current.CancellationToken);

        Assert.NotNull(body);
        Assert.Equal("Healthy", body.Status);
    }

    [Fact]
    public async Task ReadinessReturnsServiceUnavailableWithoutDatabase()
    {
        using var baseFactory = new WebApplicationFactory<Program>();
        using var unavailableDatabaseFactory = baseFactory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.UseSetting(
                    "ConnectionStrings:DefaultConnection",
                    "Host=127.0.0.1;Port=1;Database=unavailable;Username=test;Password=test;Timeout=1");
                builder.UseSetting(
                    "Authentication:Jwt:SigningKey",
                    "integration-tests-only-signing-key-32-characters");
            });
        using var client = unavailableDatabaseFactory.CreateClient(new()
        {
            AllowAutoRedirect = false
        });

        var response = await client.GetAsync("/health/ready", TestContext.Current.CancellationToken);
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>(cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Unhealthy", body.Status);
    }

    [Fact]
    public async Task DevelopmentOpenApiDescribesMinimalLoginIdentity()
    {
        using var developmentFactory = factory.WithWebHostBuilder(builder =>
            builder.UseEnvironment("Development"));
        using var client = developmentFactory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);
        var responseContent = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(responseContent);
        var paths = document.RootElement.GetProperty("paths");
        var securitySchemes = document.RootElement
            .GetProperty("components")
            .GetProperty("securitySchemes");
        var schemas = document.RootElement
            .GetProperty("components")
            .GetProperty("schemas");
        var loginProperties = schemas
            .GetProperty(nameof(LoginResponse))
            .GetProperty("properties")
            .EnumerateObject()
            .Select(property => property.Name)
            .Order()
            .ToArray();
        var userProperties = schemas
            .GetProperty(nameof(LoginUserResponse))
            .GetProperty("properties")
            .EnumerateObject()
            .Select(property => property.Name)
            .Order()
            .ToArray();

        Assert.Equal(["accessToken", "expiresAtUtc", "user"], loginProperties);
        Assert.Equal(
            ["email", "id", "profileName", "requiresPasswordChange"],
            userProperties);
        Assert.Equal(
            "bearer",
            securitySchemes.GetProperty("Bearer").GetProperty("scheme").GetString());
        Assert.False(
            paths.GetProperty("/auth/login")
                .GetProperty("post")
                .TryGetProperty("security", out _));
        Assert.Equal(
            "Bearer",
            paths.GetProperty("/access-records/open")
                .GetProperty("get")
                .GetProperty("security")[0]
                .EnumerateObject()
                .Single()
                .Name);
        Assert.False(paths.TryGetProperty("/weatherforecast", out _));
    }

    [Fact]
    public async Task DevelopmentOpenApiOperationsHaveStableDiscoveryMetadata()
    {
        using var developmentFactory = factory.WithWebHostBuilder(builder =>
            builder.UseEnvironment("Development"));
        using var client = developmentFactory.CreateClient();

        var response = await client.GetAsync(
            "/openapi/v1.json",
            TestContext.Current.CancellationToken);
        var responseContent = await response.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(responseContent);
        var operationIds = new HashSet<string>(StringComparer.Ordinal);
        var operationCount = 0;

        foreach (var path in document.RootElement.GetProperty("paths").EnumerateObject())
        {
            foreach (var operation in path.Value.EnumerateObject())
            {
                if (operation.Name is not ("get" or "post" or "put" or "delete" or "patch"))
                {
                    continue;
                }

                operationCount++;
                var metadata = operation.Value;
                var operationId = metadata.GetProperty("operationId").GetString();
                var summary = metadata.GetProperty("summary").GetString();
                var tags = metadata.GetProperty("tags");

                Assert.False(
                    string.IsNullOrWhiteSpace(operationId),
                    $"{operation.Name.ToUpperInvariant()} {path.Name} has no operationId.");
                Assert.True(
                    operationIds.Add(operationId),
                    $"The operationId '{operationId}' is duplicated.");
                Assert.False(
                    string.IsNullOrWhiteSpace(summary),
                    $"{operation.Name.ToUpperInvariant()} {path.Name} has no summary.");
                Assert.NotEmpty(tags.EnumerateArray());
            }
        }

        Assert.NotEqual(0, operationCount);
    }

    [Fact]
    public async Task DevelopmentOpenApiPublishesAdministrativeReportContracts()
    {
        using var developmentFactory = factory.WithWebHostBuilder(builder =>
            builder.UseEnvironment("Development"));
        using var client = developmentFactory.CreateClient();

        var documentJson = await client.GetStringAsync(
            "/openapi/v1.json",
            TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(documentJson);
        var root = document.RootElement;
        var paths = root.GetProperty("paths");
        var schemas = root.GetProperty("components").GetProperty("schemas");

        Assert.True(schemas.TryGetProperty(nameof(VehicleMovementReportItem), out _));
        Assert.True(schemas.TryGetProperty(nameof(InstitutionalFleetReportItem), out _));
        Assert.True(schemas.TryGetProperty(nameof(ReportActor), out _));

        Assert.Equal(
            ["200", "400", "401", "403"],
            ResponseCodes(paths, "/reports/vehicle-movements", "get"));
        Assert.Equal(
            ["200", "400", "401", "403"],
            ResponseCodes(paths, "/reports/institutional-fleet", "get"));
        Assert.Equal(
            ["200", "400", "401", "403", "429", "503"],
            ResponseCodes(paths, "/reports/vehicle-movements/pdf", "post"));
        Assert.Equal(
            ["200", "400", "401", "403", "429", "503"],
            ResponseCodes(paths, "/reports/institutional-fleet/pdf", "post"));
    }

    private static string[] ResponseCodes(
        JsonElement paths,
        string path,
        string method) =>
        paths.GetProperty(path)
            .GetProperty(method)
            .GetProperty("responses")
            .EnumerateObject()
            .Select(response => response.Name)
            .Order()
            .ToArray();

    [Fact]
    public async Task DevelopmentSwaggerUiReferencesNativeOpenApiDocument()
    {
        using var developmentFactory = factory.WithWebHostBuilder(builder =>
            builder.UseEnvironment("Development"));
        using var client = developmentFactory.CreateClient();

        var response = await client.GetAsync(
            "/swagger/index.html",
            TestContext.Current.CancellationToken);
        var responseContent = await response.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken);
        var initializerResponse = await client.GetAsync(
            "/swagger/index.js",
            TestContext.Current.CancellationToken);
        var initializerContent = await initializerResponse.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        initializerResponse.EnsureSuccessStatusCode();

        const string expectedDocumentTitle = "Controle de Acesso de Veículos — API";
        const string titleOpeningTag = "<title>";
        const string titleClosingTag = "</title>";

        var titleStartIndex = responseContent.IndexOf(
            titleOpeningTag,
            StringComparison.OrdinalIgnoreCase);
        Assert.True(titleStartIndex >= 0, "Swagger UI document has no title element.");

        var titleContentStartIndex = titleStartIndex + titleOpeningTag.Length;
        var titleEndIndex = responseContent.IndexOf(
            titleClosingTag,
            titleContentStartIndex,
            StringComparison.OrdinalIgnoreCase);
        Assert.True(titleEndIndex >= 0, "Swagger UI title element is not closed.");

        var encodedDocumentTitle = responseContent[
            titleContentStartIndex..titleEndIndex];
        Assert.Equal(
            expectedDocumentTitle,
            WebUtility.HtmlDecode(encodedDocumentTitle));
        Assert.Contains("/openapi/v1.json", initializerContent);
    }

    [Theory]
    [InlineData("/openapi/v1.json")]
    [InlineData("/swagger/index.html")]
    public async Task InteractiveApiDocumentationIsUnavailableOutsideDevelopment(
        string endpoint)
    {
        var response = await _client.GetAsync(
            endpoint,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private sealed record HealthResponse(string Status, DateTime Timestamp);

}
