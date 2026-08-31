using ControleAcessoVeiculos.API.Observability;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace ControleAcessoVeiculos.IntegrationTests;

public sealed class ObservabilityTests
{
    [Theory]
    [InlineData("/health")]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public void HealthEndpointsAreExcludedFromTraces(string path)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;

        Assert.False(ApiObservability.ShouldTraceRequest(context));
    }

    [Fact]
    public void OperationalEndpointsRemainTraceable()
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/access-records/open";

        Assert.True(ApiObservability.ShouldTraceRequest(context));
    }

    [Fact]
    public void EnabledObservabilityRequiresAServiceName()
    {
        var options = new ObservabilityOptions
        {
            Enabled = true,
            ServiceName = " "
        };

        var exception = Assert.Throws<InvalidOperationException>(options.Validate);

        Assert.Contains("Observability:ServiceName", exception.Message);
    }

    [Fact]
    public void DisabledObservabilityDoesNotRequireAServiceName()
    {
        var options = new ObservabilityOptions
        {
            Enabled = false,
            ServiceName = " "
        };

        options.Validate();
    }

    [Fact]
    public void EnabledObservabilityRegistersTraceAndMetricProviders()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Observability:Enabled"] = "true",
                ["Observability:ServiceName"] = "test-api",
                [ApiObservability.OtlpEndpointEnvironmentVariable] = "http://localhost:4317"
            })
            .Build();
        var services = new ServiceCollection();

        services.AddLogging();
        services.AddApiObservability(configuration);

        using var provider = services.BuildServiceProvider();
        Assert.NotNull(provider.GetService<TracerProvider>());
        Assert.NotNull(provider.GetService<MeterProvider>());
    }

    [Fact]
    public void QueryStringRedactionCannotBeDisabled()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Observability:Enabled"] = "true",
                ["Observability:ServiceName"] = "test-api",
                [ApiObservability.OtlpEndpointEnvironmentVariable] = "http://localhost:4317",
                [ApiObservability.DisableQueryRedactionEnvironmentVariable] = "true"
            })
            .Build();
        var services = new ServiceCollection();

        var exception = Assert.Throws<InvalidOperationException>(() =>
            services.AddApiObservability(configuration));

        Assert.Contains(
            ApiObservability.DisableQueryRedactionEnvironmentVariable,
            exception.Message);
    }

    [Fact]
    public void EnabledObservabilityRequiresAnExplicitOtlpEndpoint()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Observability:Enabled"] = "true",
                ["Observability:ServiceName"] = "test-api"
            })
            .Build();
        var services = new ServiceCollection();

        var exception = Assert.Throws<InvalidOperationException>(() =>
            services.AddApiObservability(configuration));

        Assert.Contains(
            ApiObservability.OtlpEndpointEnvironmentVariable,
            exception.Message);
    }

    [Fact]
    public void OtlpEndpointCannotContainEmbeddedCredentials()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Observability:Enabled"] = "true",
                ["Observability:ServiceName"] = "test-api",
                [ApiObservability.OtlpEndpointEnvironmentVariable] =
                    "https://user:password@collector.example:4317"
            })
            .Build();
        var services = new ServiceCollection();

        var exception = Assert.Throws<InvalidOperationException>(() =>
            services.AddApiObservability(configuration));

        Assert.Contains("sem credenciais", exception.Message);
    }
}
