using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class MotoristaInstitucionalTests
{
    private static readonly DateTime CreatedAtUtc =
        new(2026, 8, 29, 10, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Constructor_ShouldCreateActiveAuthorizationWithActor()
    {
        var driver = new MotoristaInstitucional(10, 20, CreatedAtUtc);

        Assert.Equal(10, driver.PessoaId);
        Assert.Equal(20, driver.CriadoPorId);
        Assert.True(driver.Ativo);
        Assert.Equal(CreatedAtUtc, driver.DataCriacao);
        Assert.Null(driver.AtualizadoPorId);
    }

    [Fact]
    public void DeactivateAndReactivate_ShouldPreserveLifecycleAuthorship()
    {
        var driver = new MotoristaInstitucional(10, 20, CreatedAtUtc);
        var deactivatedAtUtc = CreatedAtUtc.AddDays(1);
        var reactivatedAtUtc = CreatedAtUtc.AddDays(2);

        driver.Desativar(deactivatedAtUtc, atualizadoPorId: 21);

        Assert.False(driver.Ativo);
        Assert.Equal(21, driver.AtualizadoPorId);
        Assert.Equal(deactivatedAtUtc, driver.DataAlteracao);

        driver.Reativar(reactivatedAtUtc, atualizadoPorId: 22);

        Assert.True(driver.Ativo);
        Assert.Equal(22, driver.AtualizadoPorId);
        Assert.Equal(reactivatedAtUtc, driver.DataAlteracao);
    }

    [Fact]
    public void LifecycleMethods_ShouldRejectRepeatedStateTransitions()
    {
        var driver = new MotoristaInstitucional(10, 20, CreatedAtUtc);

        Assert.Throws<InvalidOperationException>(() =>
            driver.Reativar(CreatedAtUtc.AddMinutes(1), 21));

        driver.Desativar(CreatedAtUtc.AddMinutes(2), 21);

        Assert.Throws<InvalidOperationException>(() =>
            driver.Desativar(CreatedAtUtc.AddMinutes(3), 21));
    }

    [Fact]
    public void Deactivate_ShouldRejectTimeBeforeAuthorization()
    {
        var driver = new MotoristaInstitucional(10, 20, CreatedAtUtc);

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            driver.Desativar(CreatedAtUtc.AddTicks(-1), 21));
    }
}
