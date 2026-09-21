using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class UsuarioTests
{
    [Fact]
    public void ConstructorNormalizesEmail()
    {
        var usuario = new Usuario("  USER@Example.COM ", "hash", 1, 1);

        Assert.Equal("user@example.com", usuario.Email);
        Assert.True(usuario.PodeAutenticar(DateTime.UtcNow));
    }

    [Fact]
    public void FailedAttemptsTemporarilyBlockAuthentication()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("user@example.com", "hash", 1, 1);

        for (var attempt = 0; attempt < 5; attempt++)
        {
            usuario.RegistrarTentativaFalha(now, 5, TimeSpan.FromMinutes(15));
        }

        Assert.False(usuario.PodeAutenticar(now.AddMinutes(14)));
        Assert.True(usuario.PodeAutenticar(now.AddMinutes(16)));
    }

    [Fact]
    public void SuccessfulAuthenticationClearsPreviousFailures()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("user@example.com", "hash", 1, 1);
        usuario.RegistrarTentativaFalha(now, 5, TimeSpan.FromMinutes(15));

        usuario.RegistrarAutenticacaoBemSucedida(now.AddSeconds(1));

        Assert.Equal(0, usuario.TentativasFalhas);
        Assert.Null(usuario.BloqueadoAte);
    }

    [Fact]
    public void ReactivationRestoresAccountAndClearsAuthenticationLockout()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("user@example.com", "hash", 1, 1);
        usuario.RegistrarTentativaFalha(now, 1, TimeSpan.FromMinutes(15));
        usuario.Desativar(now.AddMinutes(1));

        usuario.Reativar(now.AddMinutes(2));

        Assert.True(usuario.Ativo);
        Assert.Equal(0, usuario.TentativasFalhas);
        Assert.Null(usuario.BloqueadoAte);
        Assert.Equal(now.AddMinutes(2), usuario.DataAlteracao);
    }

    [Fact]
    public void PasswordHashUpgradeReplacesHashAndRecordsChangeTime()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("user@example.com", "old-hash", 1, 1);

        usuario.AtualizarSenhaHash("new-hash", now);

        Assert.Equal("new-hash", usuario.SenhaHash);
        Assert.Equal(now, usuario.DataAlteracao);
    }

    [Fact]
    public void PasswordHashUpgradeRejectsEmptyHash()
    {
        var usuario = new Usuario("user@example.com", "old-hash", 1, 1);

        Assert.Throws<ArgumentException>(() =>
            usuario.AtualizarSenhaHash(" ", DateTime.UtcNow));
    }

    [Fact]
    public void PasswordChangeIncrementsCredentialVersionAndClearsLockout()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("user@example.com", "old-hash", 1, 1);
        usuario.RegistrarTentativaFalha(now, 1, TimeSpan.FromMinutes(15));

        usuario.TrocarSenhaHash("new-hash", now.AddMinutes(1));

        Assert.Equal("new-hash", usuario.SenhaHash);
        Assert.Equal(2, usuario.VersaoCredencial);
        Assert.Equal(0, usuario.TentativasFalhas);
        Assert.Null(usuario.BloqueadoAte);
        Assert.Equal(now.AddMinutes(1), usuario.DataAlteracao);
    }

    [Fact]
    public void PasswordHashUpgradeDoesNotInvalidateExistingCredentialVersion()
    {
        var usuario = new Usuario("user@example.com", "old-hash", 1, 1);

        usuario.AtualizarSenhaHash("upgraded-hash", DateTime.UtcNow);

        Assert.Equal(1, usuario.VersaoCredencial);
    }
}
