using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ControleAcessoVeiculos.API.Health;

public sealed class DatabaseReadinessHealthCheck(IServiceScopeFactory scopeFactory)
    : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var dbContext = scope.ServiceProvider
                .GetRequiredService<ControleAcessoVeiculosDbContext>();

            return await dbContext.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Database is unavailable.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return HealthCheckResult.Unhealthy("Database is unavailable.");
        }
    }
}
