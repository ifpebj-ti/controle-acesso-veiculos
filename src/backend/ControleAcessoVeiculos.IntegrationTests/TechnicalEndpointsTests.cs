using System.Net.Http.Json;

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
