using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Domain.Tests;

public class PessoaTests
{
    [Fact]
    public void Constructor_ShouldAllowPersonWithoutDocument()
    {
        var pessoa = new Pessoa("Pessoa Fictícia");

        Assert.Equal("Pessoa Fictícia", pessoa.Nome);
        Assert.Null(pessoa.DocumentoTipo);
        Assert.Null(pessoa.DocumentoNumero);
        Assert.True(pessoa.Ativo);
    }

    [Fact]
    public void Constructor_ShouldRequireDocumentTypeAndNumberTogether()
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            new Pessoa("Pessoa Fictícia", documentoTipo: "CPF"));

        Assert.Contains("em conjunto", exception.Message);
    }
}
