using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

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

    [Fact]
    public void TemporaryCredentialRequiresExpirationAndStopsAuthenticationAfterIt()
    {
        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(30);
        var usuario = new Usuario(
            "temporary@example.com",
            "temporary-hash",
            1,
            1,
            trocaSenhaObrigatoria: true,
            credencialTemporariaExpiraEm: expiresAt);

        Assert.True(usuario.TrocaSenhaObrigatoria);
        Assert.Equal(expiresAt, usuario.CredencialTemporariaExpiraEm);
        Assert.True(usuario.PodeAutenticar(now));
        Assert.False(usuario.PodeAutenticar(expiresAt));
    }

    [Fact]
    public void TemporaryCredentialCanBeConsumedOnlyOnce()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario(
            "temporary@example.com",
            "temporary-hash",
            1,
            1,
            trocaSenhaObrigatoria: true,
            credencialTemporariaExpiraEm: now.AddMinutes(30));

        usuario.ConsumirCredencialTemporaria(now);

        Assert.Equal(now, usuario.CredencialTemporariaUtilizadaEm);
        Assert.False(usuario.PodeAutenticar(now.AddSeconds(1)));
        Assert.Throws<InvalidOperationException>(
            () => usuario.ConsumirCredencialTemporaria(now.AddSeconds(1)));
    }

    [Fact]
    public void PasswordChangeCompletesTemporaryCredentialSetup()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario(
            "temporary@example.com",
            "temporary-hash",
            1,
            1,
            trocaSenhaObrigatoria: true,
            credencialTemporariaExpiraEm: now.AddMinutes(30));

        usuario.TrocarSenhaHash("permanent-hash", now.AddMinutes(1));

        Assert.False(usuario.TrocaSenhaObrigatoria);
        Assert.Null(usuario.CredencialTemporariaExpiraEm);
        Assert.Null(usuario.CredencialTemporariaUtilizadaEm);
        Assert.Equal(2, usuario.VersaoCredencial);
        Assert.Equal("permanent-hash", usuario.SenhaHash);
    }

    [Fact]
    public void AdministrativeResetRotatesCredentialAndClearsLockout()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("user@example.com", "old-hash", 1, 1);
        usuario.RegistrarTentativaFalha(now, 1, TimeSpan.FromMinutes(15));

        usuario.DefinirCredencialTemporaria(
            "temporary-hash",
            now.AddMinutes(30),
            now.AddMinutes(1));

        Assert.Equal(2, usuario.VersaoCredencial);
        Assert.True(usuario.TrocaSenhaObrigatoria);
        Assert.Equal(now.AddMinutes(30), usuario.CredencialTemporariaExpiraEm);
        Assert.Null(usuario.CredencialTemporariaUtilizadaEm);
        Assert.Equal(0, usuario.TentativasFalhas);
        Assert.Null(usuario.BloqueadoAte);
    }

    [Fact]
    public void GoogleLinkDisablesPasswordAuthenticationAndRotatesCredentialVersion()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario(
            "google@example.com",
            senhaHash: null,
            pessoaId: 1,
            perfilId: 1,
            metodoAutenticacao: MetodoAutenticacao.Google);

        usuario.VincularIdentidadeGoogle(" google-subject-123 ", now);

        Assert.Equal("google-subject-123", usuario.GoogleSubject);
        Assert.Equal(now, usuario.GoogleVinculadoEm);
        Assert.Equal(2, usuario.VersaoCredencial);
        Assert.False(usuario.PodeAutenticarComSenha(now));
        Assert.True(usuario.PodeAutenticarComGoogle(now));
    }

    [Fact]
    public void RepeatingSameGoogleLinkIsIdempotentButDifferentSubjectIsRejected()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario(
            "google@example.com",
            senhaHash: null,
            pessoaId: 1,
            perfilId: 1,
            metodoAutenticacao: MetodoAutenticacao.Google);
        usuario.VincularIdentidadeGoogle("google-subject-123", now);

        usuario.VincularIdentidadeGoogle("google-subject-123", now.AddMinutes(1));

        Assert.Equal(2, usuario.VersaoCredencial);
        Assert.Equal(now, usuario.GoogleVinculadoEm);
        Assert.Throws<InvalidOperationException>(() =>
            usuario.VincularIdentidadeGoogle(
                "different-google-subject",
                now.AddMinutes(2)));
    }

    [Fact]
    public void GoogleAccountCannotContainLocalPassword()
    {
        Assert.Throws<ArgumentException>(() => new Usuario(
            "google@example.com",
            "unexpected-local-hash",
            pessoaId: 1,
            perfilId: 1,
            metodoAutenticacao: MetodoAutenticacao.Google));
    }

    [Fact]
    public void PendingGoogleAccountHasNoUsableAuthenticationUntilLinked()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario(
            "pending@example.com",
            senhaHash: null,
            pessoaId: 1,
            perfilId: 1,
            metodoAutenticacao: MetodoAutenticacao.Google);

        Assert.False(usuario.PodeAutenticarComSenha(now));
        Assert.True(usuario.PodeAutenticarComGoogle(now));
        Assert.Null(usuario.GoogleSubject);
    }

    [Fact]
    public void GoogleLinkConvertsLegacyLocalAccountAndRemovesPassword()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("legacy@example.com", "legacy-hash", 1, 1);

        usuario.VincularIdentidadeGoogle("stable-subject", now);

        Assert.Equal(MetodoAutenticacao.Google, usuario.MetodoAutenticacao);
        Assert.Null(usuario.SenhaHash);
        Assert.Equal("stable-subject", usuario.GoogleSubject);
        Assert.False(usuario.PodeAutenticarComSenha(now));
    }

    [Fact]
    public void OperationalProfileChangePreservesLinkedGoogleIdentity()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario(
            "google@example.com",
            senhaHash: null,
            pessoaId: 1,
            perfilId: 1,
            metodoAutenticacao: MetodoAutenticacao.Google);
        usuario.VincularIdentidadeGoogle("stable-subject", now);

        usuario.AlterarPerfilEAutenticacao(
            perfilId: 2,
            MetodoAutenticacao.Google,
            now.AddMinutes(1));

        Assert.Equal(2, usuario.PerfilId);
        Assert.Equal(MetodoAutenticacao.Google, usuario.MetodoAutenticacao);
        Assert.Equal("stable-subject", usuario.GoogleSubject);
        Assert.Null(usuario.SenhaHash);
        Assert.Equal(3, usuario.VersaoCredencial);
    }

    [Fact]
    public void PromotionToAdministratorRemovesGoogleLinkAndRequiresTemporaryCredential()
    {
        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(30);
        var usuario = new Usuario(
            "google@example.com",
            senhaHash: null,
            pessoaId: 1,
            perfilId: 1,
            metodoAutenticacao: MetodoAutenticacao.Google);
        usuario.VincularIdentidadeGoogle("stable-subject", now);

        usuario.AlterarPerfilEAutenticacao(
            perfilId: 2,
            MetodoAutenticacao.Local,
            now.AddMinutes(1),
            "temporary-hash",
            expiresAt);

        Assert.Equal(MetodoAutenticacao.Local, usuario.MetodoAutenticacao);
        Assert.Equal("temporary-hash", usuario.SenhaHash);
        Assert.True(usuario.TrocaSenhaObrigatoria);
        Assert.Equal(expiresAt, usuario.CredencialTemporariaExpiraEm);
        Assert.Null(usuario.GoogleSubject);
        Assert.Null(usuario.GoogleVinculadoEm);
    }

    [Fact]
    public void DemotionToOperationalProfileRemovesLocalCredential()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("admin@example.com", "hash", 1, 1);

        usuario.AlterarPerfilEAutenticacao(
            perfilId: 2,
            MetodoAutenticacao.Google,
            now);

        Assert.Equal(MetodoAutenticacao.Google, usuario.MetodoAutenticacao);
        Assert.Null(usuario.SenhaHash);
        Assert.False(usuario.TrocaSenhaObrigatoria);
        Assert.Null(usuario.CredencialTemporariaExpiraEm);
        Assert.False(usuario.PodeAutenticarComSenha(now));
    }
}
