using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class PaperReconciliationMigrationTests(ApiFactory factory)
{
    [Fact]
    public async Task UpgradeDowngradeAndUpgradePreserveExistingBusinessRows()
    {
        var ct = TestContext.Current.CancellationToken;
        using var scope = factory.Services.CreateScope();
        var source = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var connection = new NpgsqlConnectionStringBuilder(source.Database.GetConnectionString());
        var ownedName = "cav_paper_migration_" + Guid.NewGuid().ToString("N");
        connection.Database = "postgres";
        await using var admin = new NpgsqlConnection(connection.ConnectionString);
        await admin.OpenAsync(ct);
        await using (var create = new NpgsqlCommand($"CREATE DATABASE {ownedName}", admin)) await create.ExecuteNonQueryAsync(ct);
        try
        {
            connection.Database = ownedName;
            var options = new DbContextOptionsBuilder<ControleAcessoVeiculosDbContext>().UseNpgsql(connection.ConnectionString).Options;
            await using var db = new ControleAcessoVeiculosDbContext(options);
            var migrations = db.Database.GetMigrations().ToArray();
            Assert.EndsWith("AddPaperReconciliation", migrations[^1]);
            var migrator = db.GetService<IMigrator>();
            await migrator.MigrateAsync(migrations[^2], ct);
            var person = new Pessoa("Pessoa fictícia preexistente");
            db.Pessoas.Add(person);
            await db.SaveChangesAsync(ct);
            await migrator.MigrateAsync(migrations[^1], ct);
            Assert.Empty(await db.ReconciliacoesContingencia.ToListAsync(ct));
            Assert.Empty(await db.IncidentesContingencia.ToListAsync(ct));
            Assert.False(db.Database.HasPendingModelChanges());
            await migrator.MigrateAsync(migrations[^2], ct);
            Assert.Equal(person.Id, (await db.Pessoas.SingleAsync(ct)).Id);
            await migrator.MigrateAsync(migrations[^1], ct);
            Assert.Equal(person.Id, (await db.Pessoas.SingleAsync(ct)).Id);
            Assert.Empty(await db.ReconciliacoesContingencia.ToListAsync(ct));
        }
        finally
        {
            Assert.StartsWith("cav_paper_migration_", ownedName);
            await using var ownedPool = new NpgsqlConnection(connection.ConnectionString);
            NpgsqlConnection.ClearPool(ownedPool);
            await using var drop = new NpgsqlCommand($"DROP DATABASE {ownedName} WITH (FORCE)", admin);
            await drop.ExecuteNonQueryAsync(CancellationToken.None);
        }
    }
}
