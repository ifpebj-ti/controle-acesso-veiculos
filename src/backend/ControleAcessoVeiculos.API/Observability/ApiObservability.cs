using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace ControleAcessoVeiculos.API.Observability;

public static class ApiObservability
{
    public const string DisableQueryRedactionEnvironmentVariable =
        "OTEL_DOTNET_EXPERIMENTAL_ASPNETCORE_DISABLE_URL_QUERY_REDACTION";
    public const string OtlpEndpointEnvironmentVariable =
        "OTEL_EXPORTER_OTLP_ENDPOINT";

    public static void AddApiObservability(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var options = configuration
            .GetSection(ObservabilityOptions.SectionName)
            .Get<ObservabilityOptions>() ?? new ObservabilityOptions();
        options.Validate();

        if (options.Enabled &&
            configuration.GetValue<bool>(DisableQueryRedactionEnvironmentVariable))
        {
            throw new InvalidOperationException(
                $"{DisableQueryRedactionEnvironmentVariable} não pode ser habilitada porque valores de query string devem permanecer ocultos.");
        }

        if (options.Enabled)
        {
            ValidateOtlpEndpoint(configuration[OtlpEndpointEnvironmentVariable]);
        }

        services.Configure<ObservabilityOptions>(
            configuration.GetSection(ObservabilityOptions.SectionName));

        if (!options.Enabled)
        {
            return;
        }

        var serviceVersion = typeof(Program).Assembly.GetName().Version?.ToString();

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService(
                options.ServiceName,
                serviceVersion: serviceVersion))
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation(instrumentation =>
                    instrumentation.Filter = ShouldTraceRequest)
                .AddOtlpExporter())
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddRuntimeInstrumentation()
                .AddOtlpExporter());
    }

    public static bool ShouldTraceRequest(HttpContext context) =>
        !context.Request.Path.StartsWithSegments("/health");

    private static void ValidateOtlpEndpoint(string? endpointValue)
    {
        if (!Uri.TryCreate(endpointValue, UriKind.Absolute, out var endpoint) ||
            (endpoint.Scheme != Uri.UriSchemeHttp && endpoint.Scheme != Uri.UriSchemeHttps) ||
            !string.IsNullOrEmpty(endpoint.UserInfo) ||
            !string.IsNullOrEmpty(endpoint.Query) ||
            !string.IsNullOrEmpty(endpoint.Fragment))
        {
            throw new InvalidOperationException(
                $"{OtlpEndpointEnvironmentVariable} deve ser uma URL HTTP ou HTTPS absoluta, sem credenciais, query string ou fragmento.");
        }
    }
}
