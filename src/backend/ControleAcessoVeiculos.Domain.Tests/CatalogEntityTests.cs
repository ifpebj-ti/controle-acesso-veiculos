using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class CatalogEntityTests
{
    [Fact]
    public void AccessCategoryStartsActiveAndPreservesOptionalPolicy()
    {
        var category = new CategoriaAcesso(
            "Visitor",
            "External visitor",
            tempoValidadeDias: 30);

        Assert.Equal("Visitor", category.Nome);
        Assert.Equal("External visitor", category.Descricao);
        Assert.Equal(30, category.TempoValidadeDias);
        Assert.True(category.Ativo);
        Assert.NotEqual(default, category.DataCriacao);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void AccessCategoryRequiresName(string name)
    {
        Assert.Throws<ArgumentException>(() => new CategoriaAcesso(name));
    }

    [Fact]
    public void AccessCategoryRejectsNegativeValidity()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new CategoriaAcesso("Visitor", tempoValidadeDias: -1));
    }

    [Fact]
    public void ProfileStartsActiveWithDeclaredIdentity()
    {
        var profile = new Perfil("Porteiro", "Operação da portaria");

        Assert.Equal("Porteiro", profile.Nome);
        Assert.Equal("Operação da portaria", profile.Descricao);
        Assert.True(profile.Ativo);
        Assert.NotEqual(default, profile.DataCriacao);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ProfileRequiresName(string name)
    {
        Assert.Throws<ArgumentException>(() => new Perfil(name));
    }
}
