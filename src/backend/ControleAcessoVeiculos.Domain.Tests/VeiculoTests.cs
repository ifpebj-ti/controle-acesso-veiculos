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
        Assert.Equal("PATRIMÔNIO 0001", veiculo.IdentificacaoVeiculo);
    }

    [Theory]
    [InlineData("abc-1d23", "ABC1D23")]
    [InlineData(" ABC 1234 ", "ABC1234")]
    public void Constructor_ShouldNormalizePlate(string input, string expected)
    {
        var veiculo = new Veiculo(input, "Automóvel", null, false);

        Assert.Equal(expected, veiculo.Placa);
    }

    [Fact]
    public void Constructor_ShouldRejectPlateWithoutLettersOrNumbers()
    {
        Assert.Throws<ArgumentException>(() =>
            new Veiculo("---", "Automóvel", null, false));
    }

    [Theory]
    [InlineData(" patrimônio 0001 ", "PATRIMÔNIO 0001")]
    [InlineData("van-02", "VAN-02")]
    public void Constructor_ShouldNormalizeAlternativeIdentification(
        string input,
        string expected)
    {
        var veiculo = new Veiculo(null, "Automóvel", input, true);

        Assert.Equal(expected, veiculo.IdentificacaoVeiculo);
    }
}
