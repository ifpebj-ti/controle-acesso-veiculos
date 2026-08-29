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

    [Fact]
    public void AtualizarDados_ShouldNormalizeValuesAndTrackServerTime()
    {
        var veiculo = new Veiculo("ABC1234", "Automóvel", "FROTA-01", true);
        var changedAt = veiculo.DataCriacao.AddMinutes(1);

        var changed = veiculo.AtualizarDados(
            " def-5g67 ",
            " Van ",
            " frota-02 ",
            " Marca ",
            " Modelo ",
            " Branco ",
            2026,
            changedAt);

        Assert.True(changed);
        Assert.Equal("DEF5G67", veiculo.Placa);
        Assert.Equal("FROTA-02", veiculo.IdentificacaoVeiculo);
        Assert.Equal("Van", veiculo.Tipo);
        Assert.Equal(changedAt, veiculo.DataAlteracao);
    }

    [Fact]
    public void AtualizarDados_ShouldRemainIdempotentWhenValuesDoNotChange()
    {
        var veiculo = new Veiculo("ABC1234", "Automóvel", "FROTA-01", true);

        var changed = veiculo.AtualizarDados(
            "abc-1234",
            "Automóvel",
            "frota-01",
            null,
            null,
            null,
            null,
            veiculo.DataCriacao.AddMinutes(1));

        Assert.False(changed);
        Assert.Null(veiculo.DataAlteracao);
    }

    [Fact]
    public void DeactivateAndReactivate_ShouldPreserveVehicleAndTrackState()
    {
        var veiculo = new Veiculo("ABC1234", "Automóvel", null, true);
        var deactivatedAt = veiculo.DataCriacao.AddMinutes(1);
        var reactivatedAt = deactivatedAt.AddMinutes(1);

        veiculo.Desativar(deactivatedAt);

        Assert.False(veiculo.Ativo);
        Assert.Throws<InvalidOperationException>(() => veiculo.Desativar(deactivatedAt));

        veiculo.Reativar(reactivatedAt);

        Assert.True(veiculo.Ativo);
        Assert.Equal(reactivatedAt, veiculo.DataAlteracao);
        Assert.Throws<InvalidOperationException>(() => veiculo.Reativar(reactivatedAt));
    }

    [Fact]
    public void Changes_ShouldRejectTimestampBeforeCreation()
    {
        var veiculo = new Veiculo("ABC1234", "Automóvel", null, true);

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            veiculo.Desativar(veiculo.DataCriacao.AddTicks(-1)));
    }
}
