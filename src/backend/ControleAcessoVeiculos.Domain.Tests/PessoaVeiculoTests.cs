using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Domain.Tests;

public class PessoaVeiculoTests
{
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
