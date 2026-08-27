using ControleAcessoVeiculos.Infrastructure.Data;
using DotNet.Testcontainers.Builders;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace ControleAcessoVeiculos.IntegrationTests;

public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("controle_acesso_tests")
        .WithUsername("integration_tests")
        .WithPassword("integration-tests-only")
        .WithWaitStrategy(Wait.ForUnixContainer().UntilCommandIsCompleted(
            "pg_isready",
            "-U",
            "integration_tests",
            "-d",
            "controle_acesso_tests"))
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();

        await dbContext.Database.MigrateAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        Dispose();
        await _postgres.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            _postgres.GetConnectionString());
    }
}
