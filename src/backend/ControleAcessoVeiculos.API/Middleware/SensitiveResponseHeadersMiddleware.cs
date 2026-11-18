namespace ControleAcessoVeiculos.API.Middleware;

public sealed class SensitiveResponseHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        // Authentication runs later. Evaluate at response start so successful
        // reads, authorization errors and rejected credentials share the policy.
        context.Response.OnStarting(() =>
        {
            if (context.User.Identity?.IsAuthenticated == true ||
                context.Request.Headers.ContainsKey("Authorization"))
            {
                context.Response.Headers.CacheControl = "no-store";
            }

            return Task.CompletedTask;
        });

        await next(context);
    }
}
