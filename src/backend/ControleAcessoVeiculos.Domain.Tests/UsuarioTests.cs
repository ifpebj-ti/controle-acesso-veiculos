using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class UsuarioTests
{
    [Theory]
    [InlineData("", 1, 1)]
    [InlineData("user@example.com", 0, 1)]
    [InlineData("user@example.com", 1, 0)]
    public void ConstructorRejectsInvalidIdentity(
        string email,
        int personId,
        int profileId)
    {
        Assert.ThrowsAny<ArgumentException>(() =>
            new Usuario(email, "hash", personId, profileId));
    }

    [Fact]
    public void ConstructorRequiresPasswordForLocalAccount()
    {
        Assert.ThrowsAny<ArgumentException>(() => new Usuario(
            "local@example.com",
            null,
            1,
            1));
    }

    [Fact]
    public void ConstructorRejectsInconsistentTemporaryCredentialState()
    {
        var now = DateTime.UtcNow;

        Assert.Throws<ArgumentException>(() => new Usuario(
            "temporary@example.com",
            "hash",
            1,
            1,
            trocaSenhaObrigatoria: true));
        Assert.Throws<ArgumentException>(() => new Usuario(
            "permanent@example.com",
            "hash",
            1,
            1,
            credencialTemporariaExpiraEm: now.AddMinutes(30)));
        Assert.Throws<ArgumentException>(() => new Usuario(
            "permanent@example.com",
            "hash",
            1,
            1,
            credencialTemporariaUtilizadaEm: now));
    }

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
    public void FailedAttemptValidatesPolicyAndResetsExpiredLockout()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("user@example.com", "hash", 1, 1);

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            usuario.RegistrarTentativaFalha(now, 0, TimeSpan.FromMinutes(1)));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            usuario.RegistrarTentativaFalha(now, 1, TimeSpan.Zero));

        usuario.RegistrarTentativaFalha(now, 1, TimeSpan.FromMinutes(1));
        usuario.RegistrarTentativaFalha(now.AddMinutes(2), 2, TimeSpan.FromMinutes(1));

        Assert.Equal(1, usuario.TentativasFalhas);
        Assert.Null(usuario.BloqueadoAte);
    }

    [Fact]
    public void InactiveAccountCannotAuthenticate()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("user@example.com", "hash", 1, 1);

        usuario.Desativar(now);

        Assert.False(usuario.PodeAutenticar(now));
        Assert.Equal(now, usuario.DataAlteracao);
    }

    [Fact]
    public void AuthenticationMethodChecksStillHonorAccountState()
    {
        var now = DateTime.UtcNow;
        var local = new Usuario("local@example.com", "hash", 1, 1);
        var google = new Usuario(
            "google@example.com",
            null,
            1,
            1,
            metodoAutenticacao: MetodoAutenticacao.Google);

        local.RegistrarTentativaFalha(now, 1, TimeSpan.FromMinutes(5));
        google.Desativar(now);

        Assert.False(local.PodeAutenticarComSenha(now.AddMinutes(1)));
        Assert.False(google.PodeAutenticarComGoogle(now));
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
    public void GoogleAccountRejectsLocalPasswordOperations()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario(
            "google@example.com",
            null,
            1,
            1,
            metodoAutenticacao: MetodoAutenticacao.Google);

        Assert.Throws<InvalidOperationException>(() =>
            usuario.AtualizarSenhaHash("hash", now));
        Assert.Throws<InvalidOperationException>(() =>
            usuario.TrocarSenhaHash("hash", now));
        Assert.Throws<InvalidOperationException>(() =>
            usuario.DefinirCredencialTemporaria("hash", now.AddMinutes(1), now));
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
    public void PermanentAndExpiredCredentialsCannotBeConsumed()
    {
        var now = DateTime.UtcNow;
        var permanent = new Usuario("permanent@example.com", "hash", 1, 1);
        var expired = new Usuario(
            "expired@example.com",
            "hash",
            1,
            1,
            trocaSenhaObrigatoria: true,
            credencialTemporariaExpiraEm: now);

        Assert.Throws<InvalidOperationException>(() =>
            permanent.ConsumirCredencialTemporaria(now));
        Assert.Throws<InvalidOperationException>(() =>
            expired.ConsumirCredencialTemporaria(now));
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
    public void AdministrativeResetValidatesPasswordAndExpiration()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("user@example.com", "hash", 1, 1);

        Assert.Throws<ArgumentException>(() =>
            usuario.DefinirCredencialTemporaria(" ", now.AddMinutes(1), now));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            usuario.DefinirCredencialTemporaria("new-hash", now, now));
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
    public void GoogleLinkValidatesSubject()
    {
        var usuario = new Usuario(
            "google@example.com",
            null,
            1,
            1,
            metodoAutenticacao: MetodoAutenticacao.Google);

        Assert.Throws<ArgumentException>(() =>
            usuario.VincularIdentidadeGoogle(" ", DateTime.UtcNow));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            usuario.VincularIdentidadeGoogle(new string('S', 256), DateTime.UtcNow));
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

    [Fact]
    public void ProfileChangeValidatesAuthenticationSpecificArguments()
    {
        var now = DateTime.UtcNow;
        var usuario = new Usuario("admin@example.com", "hash", 1, 1);

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            usuario.AlterarPerfilEAutenticacao(0, MetodoAutenticacao.Google, now));
        Assert.ThrowsAny<ArgumentException>(() =>
            usuario.AlterarPerfilEAutenticacao(2, MetodoAutenticacao.Local, now));
        Assert.Throws<ArgumentException>(() =>
            usuario.AlterarPerfilEAutenticacao(
                2,
                MetodoAutenticacao.Local,
                now,
                " ",
                now.AddMinutes(1)));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            usuario.AlterarPerfilEAutenticacao(
                2,
                MetodoAutenticacao.Local,
                now,
                "temporary-hash",
                now));
        Assert.Throws<ArgumentException>(() =>
            usuario.AlterarPerfilEAutenticacao(
                2,
                MetodoAutenticacao.Google,
                now,
                "unexpected-hash"));
        Assert.Throws<ArgumentException>(() =>
            usuario.AlterarPerfilEAutenticacao(
                2,
                MetodoAutenticacao.Google,
                now,
                credencialTemporariaExpiraEm: now.AddMinutes(1)));
    }
}
