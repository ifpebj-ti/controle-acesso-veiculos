using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class PostgreSqlPersistenceTests(ApiFactory factory)
{
    [Fact]
    public async Task MigrationsCreateTheExpectedSchema()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();

        var migrations = await dbContext.Database.GetAppliedMigrationsAsync();

        Assert.Contains("20260825222017_InitialCreate", migrations);
        Assert.Contains("20260826183028_AlignMvpDataModel", migrations);
        Assert.Contains("20260827232042_AddAuthenticationSecurity", migrations);
        Assert.Contains("20260829110009_AddInstitutionalDriverAuthorization", migrations);
        Assert.Contains("20260829154230_AddInstitutionalUsageHistoryIndexes", migrations);
        Assert.Contains("20260830065224_AllowSystemAuditActors", migrations);

        await dbContext.Database.OpenConnectionAsync();
        await using var command = dbContext.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'dbo'
              AND table_type = 'BASE TABLE';
            """;

        var tableCount = (long)(await command.ExecuteScalarAsync())!;

        Assert.Equal(10, tableCount);
    }

    [Fact]
    public async Task SystemAuditActorMigrationHasSafeUpgradeAndDowngrade()
    {
        using var scope = factory.Services.CreateScope();
        var sourceContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var sourceConnectionString = sourceContext.Database.GetConnectionString()!;
        var databaseName = $"migration_{Guid.NewGuid():N}";
        var adminBuilder = new NpgsqlConnectionStringBuilder(sourceConnectionString)
        {
            Database = "postgres",
            Pooling = false
        };

        await using (var adminConnection = new NpgsqlConnection(adminBuilder.ConnectionString))
        {
            await adminConnection.OpenAsync();
            await using var createCommand = adminConnection.CreateCommand();
            createCommand.CommandText = $"CREATE DATABASE \"{databaseName}\"";
            await createCommand.ExecuteNonQueryAsync();
        }

        try
        {
            var testBuilder = new NpgsqlConnectionStringBuilder(sourceConnectionString)
            {
                Database = databaseName,
                Pooling = false
            };
            var options = new DbContextOptionsBuilder<ControleAcessoVeiculosDbContext>()
                .UseNpgsql(testBuilder.ConnectionString)
                .Options;
            await using var dbContext = new ControleAcessoVeiculosDbContext(options);
            var migrator = dbContext.GetService<IMigrator>();

            await migrator.MigrateAsync();
            Assert.True(await IsAuditActorNullableAsync(dbContext));

            await dbContext.Database.ExecuteSqlRawAsync("""
                INSERT INTO dbo.auditorias
                    (tipo_acao, entidade, registro_id, usuario_id, detalhes)
                VALUES
                    ('Inclusao', 'Usuario', 1, NULL, 'Temporary system audit migration test.');
                """);

            var unsafeDowngrade = await Assert.ThrowsAnyAsync<Exception>(() =>
                migrator.MigrateAsync("20260829165235_AddGeneralAccessHistoryIndex"));
            Assert.Contains(
                "Cannot require an audit actor while system audit records exist.",
                unsafeDowngrade.ToString(),
                StringComparison.Ordinal);

            await dbContext.Database.ExecuteSqlRawAsync(
                "DELETE FROM dbo.auditorias WHERE usuario_id IS NULL");
            await migrator.MigrateAsync("20260829165235_AddGeneralAccessHistoryIndex");
            Assert.False(await IsAuditActorNullableAsync(dbContext));

            await migrator.MigrateAsync();
            Assert.True(await IsAuditActorNullableAsync(dbContext));
        }
        finally
        {
            NpgsqlConnection.ClearAllPools();
            await using var adminConnection = new NpgsqlConnection(adminBuilder.ConnectionString);
            await adminConnection.OpenAsync();
            await using var dropCommand = adminConnection.CreateCommand();
            dropCommand.CommandText = $"DROP DATABASE IF EXISTS \"{databaseName}\" WITH (FORCE)";
            await dropCommand.ExecuteNonQueryAsync();
        }
    }

    [Fact]
    public async Task DatabaseRejectsDuplicatePersonalDocument()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var documentNumber = Guid.NewGuid().ToString("N")[..12];

        dbContext.Pessoas.Add(new Pessoa(
            "Pessoa de Teste A",
            "TESTE",
            documentNumber));
        await dbContext.SaveChangesAsync();

        dbContext.Pessoas.Add(new Pessoa(
            "Pessoa de Teste B",
            "TESTE",
            documentNumber));

        await Assert.ThrowsAsync<DbUpdateException>(() => dbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task PersonVehicleRelationshipIsPersisted()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var pessoa = new Pessoa($"Pessoa {suffix}");
        var veiculo = new Veiculo(
            $"T{suffix[..7]}",
            "Teste",
            null,
            false);

        dbContext.Pessoas.Add(pessoa);
        dbContext.Veiculos.Add(veiculo);
        await dbContext.SaveChangesAsync();

        var relacao = new PessoaVeiculo(
            pessoa.Id,
            veiculo.Id,
            "Condutor",
            DateOnly.FromDateTime(DateTime.UtcNow));
        dbContext.PessoasVeiculos.Add(relacao);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var persisted = await dbContext.PessoasVeiculos.SingleAsync(item =>
            item.PessoaId == pessoa.Id && item.VeiculoId == veiculo.Id);

        Assert.Equal("Condutor", persisted.TipoRelacao);
        Assert.True(persisted.Ativo);
    }

    private static async Task<bool> IsAuditActorNullableAsync(
        ControleAcessoVeiculosDbContext dbContext)
    {
        await dbContext.Database.OpenConnectionAsync();
        await using var command = dbContext.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'dbo'
              AND table_name = 'auditorias'
              AND column_name = 'usuario_id';
            """;

        return string.Equals(
            (string?)await command.ExecuteScalarAsync(),
            "YES",
            StringComparison.Ordinal);
    }
}
