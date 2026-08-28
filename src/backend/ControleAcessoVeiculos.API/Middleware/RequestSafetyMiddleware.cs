using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ControleAcessoVeiculos.API.Middleware;

public sealed class RequestSafetyMiddleware(
    RequestDelegate next,
    ILogger<RequestSafetyMiddleware> logger)
{
    public const string CorrelationIdHeaderName = "X-Correlation-ID";
    public const int MaximumRequestBodySize = 1024 * 1024;

    private const string CorrelationIdItemKey = "RequestCorrelationId";

    public async Task InvokeAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService)
    {
        var correlationId = ResolveCorrelationId(context.Request.Headers);
        context.Items[CorrelationIdItemKey] = correlationId;
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[CorrelationIdHeaderName] = correlationId;
            return Task.CompletedTask;
        });

        using var scope = logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId
        });

        var startedAt = Stopwatch.GetTimestamp();

        try
        {
            if (context.Request.ContentLength > MaximumRequestBodySize)
            {
                context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                await problemDetailsService.WriteAsync(new ProblemDetailsContext
                {
                    HttpContext = context,
                    ProblemDetails = new ProblemDetails
                    {
                        Status = StatusCodes.Status413PayloadTooLarge,
                        Title = "Payload muito grande.",
                        Detail = "O corpo da requisição excede o limite permitido de 1 MiB."
                    }
                });
                return;
            }

            await next(context);
        }
        catch (BadHttpRequestException exception) when (!context.Response.HasStarted)
        {
            logger.LogWarning(
                "HTTP request rejected with {StatusCode}",
                exception.StatusCode);

            context.Response.Clear();
            context.Response.StatusCode = exception.StatusCode;
            await problemDetailsService.WriteAsync(new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails = new ProblemDetails
                {
                    Status = exception.StatusCode,
                    Title = exception.StatusCode == StatusCodes.Status413PayloadTooLarge
                        ? "Payload muito grande."
                        : "Requisição inválida."
                }
            });
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            logger.LogError(
                "Unhandled exception of type {ExceptionType}",
                exception.GetType().FullName);

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await problemDetailsService.WriteAsync(new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "Ocorreu um erro inesperado."
                }
            });
        }
        finally
        {
            var elapsed = Stopwatch.GetElapsedTime(startedAt);
            logger.LogInformation(
                "HTTP request completed {RequestMethod} {RequestPath} with {StatusCode} in {ElapsedMilliseconds} ms",
                context.Request.Method,
                GetSafeRequestPath(context),
                context.Response.StatusCode,
                elapsed.TotalMilliseconds);
        }
    }

    public static string? GetCorrelationId(HttpContext context) =>
        context.Items.TryGetValue(CorrelationIdItemKey, out var value)
            ? value as string
            : null;

    private static string ResolveCorrelationId(IHeaderDictionary headers)
    {
        var suppliedValue = headers[CorrelationIdHeaderName].ToString();

        return Guid.TryParse(suppliedValue, out var suppliedId)
            ? suppliedId.ToString("D")
            : Guid.NewGuid().ToString("D");
    }

    private static string GetSafeRequestPath(HttpContext context) =>
        context.GetEndpoint() is RouteEndpoint routeEndpoint
            ? routeEndpoint.RoutePattern.RawText ?? "<matched-route>"
            : "<unmatched-route>";
}
