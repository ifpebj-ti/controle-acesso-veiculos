using System.Net;
using System.Net.Http.Json;
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
        var response = await _client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();

        Assert.NotNull(body);
        Assert.Equal("Healthy", body.Status);
        Assert.NotEqual(default, body.Timestamp);
    }

    [Theory]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public async Task HealthEndpointsReturnHealthyStatus(string endpoint)
    {
        var response = await _client.GetAsync(endpoint);

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();

        Assert.NotNull(body);
        Assert.Equal("Healthy", body.Status);
    }

    [Fact]
    public async Task ReadinessReturnsServiceUnavailableWithoutDatabase()
    {
        using var unavailableDatabaseFactory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.UseSetting(
                    "ConnectionStrings:DefaultConnection",
                    "Host=127.0.0.1;Port=1;Database=unavailable;Username=test;Password=test;Timeout=1");
            });
        using var client = unavailableDatabaseFactory.CreateClient(new()
        {
            AllowAutoRedirect = false
        });

        var response = await client.GetAsync("/health/ready");
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Unhealthy", body.Status);
    }

    [Fact]
    public async Task WeatherForecastReturnsFiveItems()
    {
        var response = await _client.GetAsync("/weatherforecast");

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<WeatherForecastResponse[]>();

        Assert.NotNull(body);
        Assert.Equal(5, body.Length);
    }

    private sealed record HealthResponse(string Status, DateTime Timestamp);

    private sealed record WeatherForecastResponse(
        DateOnly Date,
        int TemperatureC,
        int TemperatureF,
        string? Summary);
}
