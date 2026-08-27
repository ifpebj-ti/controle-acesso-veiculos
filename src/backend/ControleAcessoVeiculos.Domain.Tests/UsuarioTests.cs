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
}
