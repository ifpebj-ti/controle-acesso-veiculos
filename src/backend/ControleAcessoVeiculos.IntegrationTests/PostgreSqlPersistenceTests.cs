using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

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
}
