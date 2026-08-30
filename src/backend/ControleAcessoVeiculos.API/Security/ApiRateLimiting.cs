using System.IdentityModel.Tokens.Jwt;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ControleAcessoVeiculos.API.Security;

public sealed class ApiRateLimitOptions
{
    public const string SectionName = "RateLimiting";

    public int GlobalPermitLimit { get; set; } = 300;

    public int GlobalWindowSeconds { get; set; } = 60;

    public int LoginPermitLimit { get; set; } = 30;

    public int LoginWindowSeconds { get; set; } = 60;

    public void Validate()
    {
        ValidatePositive(GlobalPermitLimit, nameof(GlobalPermitLimit));
        ValidatePositive(GlobalWindowSeconds, nameof(GlobalWindowSeconds));
        ValidatePositive(LoginPermitLimit, nameof(LoginPermitLimit));
        ValidatePositive(LoginWindowSeconds, nameof(LoginWindowSeconds));
    }

    private static void ValidatePositive(int value, string propertyName)
    {
        if (value <= 0)
        {
            throw new InvalidOperationException(
                $"{SectionName}:{propertyName} deve ser maior que zero.");
        }
    }
}

public static class ApiRateLimiting
{
    public const string LoginPolicy = "LoginRateLimit";

    public static void Configure(
        RateLimiterOptions options,
        ApiRateLimitOptions limits)
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
            context => CreateFixedWindowPartition(
                $"global:{ResolveClientKey(context)}",
                limits.GlobalPermitLimit,
                limits.GlobalWindowSeconds));
        options.AddPolicy(
            LoginPolicy,
            context => CreateFixedWindowPartition(
                $"login:{ResolveConnectionAddress(context)}",
                limits.LoginPermitLimit,
                limits.LoginWindowSeconds));
        options.OnRejected = WriteRejectedResponseAsync;
    }

    private static RateLimitPartition<string> CreateFixedWindowPartition(
        string partitionKey,
        int permitLimit,
        int windowSeconds) =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromSeconds(windowSeconds),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            });

    private static string ResolveClientKey(HttpContext context)
    {
        var subject = context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

        return string.IsNullOrWhiteSpace(subject)
            ? $"ip:{ResolveConnectionAddress(context)}"
            : $"user:{subject}";
    }

    private static string ResolveConnectionAddress(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static async ValueTask WriteRejectedResponseAsync(
        OnRejectedContext context,
        CancellationToken cancellationToken)
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
        }

        var problemDetailsService = context.HttpContext.RequestServices
            .GetRequiredService<IProblemDetailsService>();

        await problemDetailsService.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = context.HttpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status429TooManyRequests,
                Title = "Limite de requisições excedido.",
                Detail = "Aguarde antes de tentar novamente."
            }
        });
    }
}
