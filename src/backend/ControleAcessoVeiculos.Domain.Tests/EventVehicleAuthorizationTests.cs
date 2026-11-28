using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class EventVehicleAuthorizationTests
{
    [Theory]
    [InlineData(0, "Carro", 1)]
    [InlineData(1, "Carro", 0)]
    [InlineData(1, "Carro", -1)]
    public void InvalidEventOrQuotaCannotCreateAnAuthorization(int eventId, string type, int quantity)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new AutorizacaoVeiculoEvento(eventId, type, quantity));
    }

    [Fact]
    public void AuthorizationRejectsOversizedVehicleTypeAndPlate()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new AutorizacaoVeiculoEvento(1, new string('x', 51), 1));
        Assert.Throws<ArgumentOutOfRangeException>(() => new AutorizacaoVeiculoEvento(1, "Carro", 1, new string('A', 11)));
    }

    [Fact]
    public void PooledAuthorizationPreservesQuotaWithoutBindingAnIndividualPlate()
    {
        var authorization = new AutorizacaoVeiculoEvento(3, "Onibus", 5);

        Assert.Equal(3, authorization.EventoAcessoId);
        Assert.Equal("Onibus", authorization.TipoVeiculo);
        Assert.Equal(5, authorization.Quantidade);
        Assert.Null(authorization.Placa);
    }
}
