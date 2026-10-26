using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Domain.Tests;

public class PessoaVeiculoTests
{
    [Fact]
    public void ConstructorCreatesActiveRelationshipWithDeclaredValidity()
    {
        var start = new DateOnly(2026, 8, 26);
        var end = start.AddYears(1);

        var relationship = new PessoaVeiculo(
            pessoaId: 10,
            veiculoId: 20,
            tipoRelacao: "Condutor principal",
            dataInicio: start,
            dataFim: end);

        Assert.Equal(10, relationship.PessoaId);
        Assert.Equal(20, relationship.VeiculoId);
        Assert.Equal("Condutor principal", relationship.TipoRelacao);
        Assert.Equal(start, relationship.DataInicio);
        Assert.Equal(end, relationship.DataFim);
        Assert.True(relationship.Ativo);
        Assert.NotEqual(default, relationship.DataCriacao);
    }

    [Theory]
    [InlineData(0, 1, "Condutor")]
    [InlineData(-1, 1, "Condutor")]
    [InlineData(1, 0, "Condutor")]
    [InlineData(1, -1, "Condutor")]
    public void ConstructorRequiresPositiveIdentifiers(
        int personId,
        int vehicleId,
        string relationshipType)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new PessoaVeiculo(personId, vehicleId, relationshipType));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ConstructorRequiresRelationshipType(string relationshipType)
    {
        Assert.Throws<ArgumentException>(() =>
            new PessoaVeiculo(1, 1, relationshipType));
    }

    [Fact]
    public void Constructor_ShouldRejectEndDateBeforeStartDate()
    {
        var inicio = new DateOnly(2026, 8, 26);

        Assert.Throws<ArgumentException>(() =>
            new PessoaVeiculo(
                pessoaId: 1,
                veiculoId: 1,
                tipoRelacao: "Condutor",
                dataInicio: inicio,
                dataFim: inicio.AddDays(-1)));
    }
}
