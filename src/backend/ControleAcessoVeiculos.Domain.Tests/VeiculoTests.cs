using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Domain.Tests;

public class VeiculoTests
{
    [Fact]
    public void Constructor_ShouldRequirePlateOrAlternativeIdentification()
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            new Veiculo(null, "Automóvel", null, false));

        Assert.Contains("placa", exception.Message);
    }

    [Fact]
    public void Constructor_ShouldAllowInstitutionalVehicleWithoutPlate()
    {
        var veiculo = new Veiculo(
            null,
            "Trator",
            "Patrimônio 0001",
            ehInstitucional: true);

        Assert.True(veiculo.EhInstitucional);
        Assert.Equal("Patrimônio 0001", veiculo.IdentificacaoVeiculo);
    }
}
