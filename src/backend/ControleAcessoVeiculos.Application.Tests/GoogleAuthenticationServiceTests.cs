using System.Reflection;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class GoogleAuthenticationServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 10, 18, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData(null, "user@example.test", true)]
    [InlineData("subject", null, true)]
    [InlineData("subject", "invalid-email", true)]
    [InlineData("subject", "user@example.test", false)]
    public async Task InvalidProviderIdentityIsDeniedBeforeOpeningTransaction(
        string? subject,
        string? email,
        bool emailVerified)
    {
        var store = new FakeUserStore(new(null, null));
        var sessions = new FakeSessionStore();
        var service = CreateService(store, sessions);

        var result = await service.AuthenticateAsync(
            subject,
            email,
            emailVerified,
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Equal(0, sessions.TransactionCalls);
        Assert.Null(store.Audit);
    }

    [Fact]
    public async Task PreauthorizedEmailIsLinkedAndReceivesLocalSession()
    {
        var user = CreateUser(7, "authorized@example.test");
        var account = new AuthenticationUser(user, "Porteiro", ProfileIsActive: true);
        var store = new FakeUserStore(new(null, account));
        var previousSession = new SessaoAutenticacao(
            7,
            Guid.NewGuid(),
            "previous-refresh-hash",
            FixedNow.UtcDateTime.AddMinutes(-5),
            FixedNow.UtcDateTime.AddHours(1));
        var sessions = new FakeSessionStore(previousSession);
        var service = CreateService(store, sessions);

        var result = await service.AuthenticateAsync(
            "stable-google-subject",
            " AUTHORIZED@example.test ",
            emailVerified: true,
            TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal("stable-google-subject", user.GoogleSubject);
        Assert.Equal(FixedNow.UtcDateTime, user.GoogleVinculadoEm);
        Assert.Equal(2, user.VersaoCredencial);
        Assert.False(user.PodeAutenticarComSenha(FixedNow.UtcDateTime));
        Assert.NotNull(sessions.AddedSession);
        Assert.Equal(7, sessions.AddedSession.UsuarioId);
        Assert.True(previousSession.FoiRevogada);
        Assert.Equal(
            MotivoRevogacaoSessao.MetodoAutenticacaoAlterado,
            previousSession.MotivoRevogacao);
        Assert.Equal("Google", store.Audit?.Provider);
        Assert.True(store.Audit?.IdentityLinked);
        Assert.Equal("Porteiro", result.User?.ProfileName);
    }

    [Fact]
    public async Task ExistingSubjectRemainsCanonicalWhenGoogleEmailChanges()
    {
        var user = CreateUser(8, "old-email@example.test");
        user.VincularIdentidadeGoogle("stable-google-subject", FixedNow.UtcDateTime.AddDays(-1));
        var account = new AuthenticationUser(user, "Vigilante", ProfileIsActive: true);
        var store = new FakeUserStore(new(account, null));
        var sessions = new FakeSessionStore();
        var service = CreateService(store, sessions);

        var result = await service.AuthenticateAsync(
            "stable-google-subject",
            "new-email@example.test",
            emailVerified: true,
            TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal("old-email@example.test", result.User?.Email);
        Assert.False(store.Audit?.IdentityLinked);
        Assert.Equal(2, user.VersaoCredencial);
    }

    [Fact]
    public async Task ConflictingSubjectAndEmailAccountsAreDeniedWithoutSession()
    {
        var subjectAccount = new AuthenticationUser(
            CreateUser(9, "subject-owner@example.test"),
            "Porteiro",
            ProfileIsActive: true);
        subjectAccount.User.VincularIdentidadeGoogle(
            "stable-google-subject",
            FixedNow.UtcDateTime.AddDays(-1));
        var emailAccount = new AuthenticationUser(
            CreateUser(10, "presented-email@example.test"),
            "Porteiro",
            ProfileIsActive: true);
        var store = new FakeUserStore(new(subjectAccount, emailAccount));
        var sessions = new FakeSessionStore();
        var service = CreateService(store, sessions);

        var result = await service.AuthenticateAsync(
            "stable-google-subject",
            "presented-email@example.test",
            emailVerified: true,
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Null(sessions.AddedSession);
        Assert.Null(store.Audit);
        Assert.Null(emailAccount.User.GoogleSubject);
    }

    [Fact]
    public async Task UnknownOrInactiveAccountIsDeniedGenerically()
    {
        var user = CreateUser(11, "inactive@example.test");
        user.Desativar(FixedNow.UtcDateTime.AddMinutes(-1));
        var store = new FakeUserStore(new(
            null,
            new AuthenticationUser(user, "Porteiro", ProfileIsActive: true)));
        var sessions = new FakeSessionStore();
        var service = CreateService(store, sessions);

        var result = await service.AuthenticateAsync(
            "unknown-subject",
            "inactive@example.test",
            emailVerified: true,
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Null(sessions.AddedSession);
        Assert.Null(store.Audit);
    }

    [Fact]
    public async Task AdministratorProfileIsDeniedThroughGoogle()
    {
        var user = CreateUser(12, "administrator@example.test");
        var store = new FakeUserStore(new(
            null,
            new AuthenticationUser(
                user,
                "Administrador",
                ProfileIsActive: true)));
        var sessions = new FakeSessionStore();
        var service = CreateService(store, sessions);

        var result = await service.AuthenticateAsync(
            "administrator-google-subject",
            "administrator@example.test",
            emailVerified: true,
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Null(user.GoogleSubject);
        Assert.Null(sessions.AddedSession);
        Assert.Null(store.Audit);
    }

    private static GoogleAuthenticationService CreateService(
        FakeUserStore userStore,
        FakeSessionStore sessionStore) =>
        new(
            userStore,
            new FakeAccessTokenService(),
            new FakeRefreshTokenService(),
            sessionStore,
            new AuthenticationSessionPolicy(
                TimeSpan.FromMinutes(15),
                TimeSpan.FromHours(12)),
            new FixedTimeProvider(FixedNow));

    private static Usuario CreateUser(int id, string email)
    {
        var user = new Usuario(
            email,
            senhaHash: null,
            pessoaId: id,
            perfilId: 1,
            metodoAutenticacao: MetodoAutenticacao.Google);
        typeof(Usuario)
            .GetProperty(nameof(Usuario.Id), BindingFlags.Instance | BindingFlags.Public)!
            .SetValue(user, id);
        return user;
    }

    private sealed class FakeUserStore(GoogleAuthenticationLookup lookup)
        : IAuthenticationUserStore
    {
        public AuthenticationAudit? Audit { get; private set; }

        public Task<AuthenticationUser?> FindByEmailAsync(
            string normalizedEmail,
            CancellationToken cancellationToken) =>
            Task.FromResult<AuthenticationUser?>(null);

        public Task<GoogleAuthenticationLookup> FindForGoogleAuthenticationAsync(
            string subject,
            string normalizedEmail,
            CancellationToken cancellationToken) =>
            Task.FromResult(lookup);

        public Task<bool> IsAuthenticationStateValidAsync(
            int userId,
            int credentialVersion,
            CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task SaveChangesAsync(
            AuthenticationAudit? audit,
            CancellationToken cancellationToken)
        {
            Audit = audit;
            return Task.CompletedTask;
        }
    }

    private sealed class FakeSessionStore(
        params SessaoAutenticacao[] existingSessions) : IAuthenticationSessionStore
    {
        public int TransactionCalls { get; private set; }
        public SessaoAutenticacao? AddedSession { get; private set; }

        public void Add(SessaoAutenticacao session) => AddedSession = session;

        public Task<AuthenticationSession?> FindByTokenHashForUpdateAsync(
            string tokenHash,
            CancellationToken cancellationToken) =>
            Task.FromResult<AuthenticationSession?>(null);

        public Task<IReadOnlyList<SessaoAutenticacao>> FindFamilyForUpdateAsync(
            Guid familyId,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<SessaoAutenticacao>>([]);

        public Task<IReadOnlyList<SessaoAutenticacao>> FindForUserForUpdateAsync(
            int userId,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<SessaoAutenticacao>>(
                existingSessions.Where(session => session.UsuarioId == userId).ToArray());

        public async Task<TResult> ExecuteInTransactionAsync<TResult>(
            Func<CancellationToken, Task<TResult>> operation,
            CancellationToken cancellationToken)
        {
            TransactionCalls++;
            return await operation(cancellationToken);
        }
    }

    private sealed class FakeAccessTokenService : IAccessTokenService
    {
        public AccessToken Issue(
            int userId,
            string email,
            string profileName,
            int credentialVersion,
            bool requiresPasswordChange) =>
            new("test-access-token", FixedNow.UtcDateTime.AddMinutes(15));
    }

    private sealed class FakeRefreshTokenService : IRefreshTokenService
    {
        public RefreshToken Create() => new("test-refresh-token", "test-refresh-hash");

        public string ComputeHash(string token) => $"hash::{token}";
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
