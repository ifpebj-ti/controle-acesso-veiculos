using System.Reflection;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class AuthenticationSessionServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 10, 26, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task RenewRejectsMissingTokenBeforeOpeningTransaction(string token)
    {
        var fixture = new Fixture();

        var result = await fixture.Service.RenewAsync(
            token,
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Equal(0, fixture.SessionStore.TransactionCalls);
        Assert.Equal(0, fixture.RefreshTokens.HashCalls);
    }

    [Fact]
    public async Task RenewRejectsOversizedTokenBeforeHashingIt()
    {
        var fixture = new Fixture();

        var result = await fixture.Service.RenewAsync(
            new string('a', 513),
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Equal(0, fixture.SessionStore.TransactionCalls);
        Assert.Equal(0, fixture.RefreshTokens.HashCalls);
    }

    [Fact]
    public async Task RenewReturnsInvalidWhenSessionDoesNotExist()
    {
        var fixture = new Fixture();

        var result = await fixture.Service.RenewAsync(
            "unknown-token",
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Equal("hash::unknown-token", fixture.SessionStore.LastTokenHash);
        Assert.Equal(1, fixture.SessionStore.TransactionCalls);
        Assert.Empty(fixture.UserStore.Saves);
    }

    [Fact]
    public async Task RenewRotatesTokenAndIssuesNewAccessToken()
    {
        var fixture = new Fixture();
        var current = fixture.CreateSession(FixedNow.UtcDateTime.AddMinutes(-5));
        fixture.SessionStore.Found = fixture.Wrap(current);

        var result = await fixture.Service.RenewAsync(
            "current-token",
            TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal("access-token", result.AccessToken);
        Assert.Equal("successor-token", result.RefreshToken);
        Assert.Equal(FixedNow.UtcDateTime, result.SessionObservedAtUtc);
        Assert.Equal(FixedNow.UtcDateTime.AddMinutes(15), result.SessionInactivityExpiresAtUtc);
        Assert.Equal(current.ExpiraEm, result.SessionExpiresAtUtc);
        Assert.Equal("operator@example.test", result.User?.Email);
        Assert.True(current.FoiConsumida);
        Assert.Equal(MotivoRevogacaoSessao.Rotacao, current.MotivoRevogacao);
        Assert.NotNull(fixture.SessionStore.AddedSession);
        Assert.Single(fixture.UserStore.Saves);
        Assert.Null(fixture.UserStore.Saves[0]);
    }

    [Fact]
    public async Task RenewRevokesFamilyWhenConsumedTokenIsReused()
    {
        var fixture = new Fixture();
        var reused = fixture.CreateSession(FixedNow.UtcDateTime.AddMinutes(-5));
        var successor = reused.Rotacionar(
            "previous-successor",
            FixedNow.UtcDateTime.AddMinutes(-1),
            TimeSpan.FromMinutes(15));
        fixture.SessionStore.Found = fixture.Wrap(reused);
        fixture.SessionStore.Family = [reused, successor];

        var result = await fixture.Service.RenewAsync(
            "reused-token",
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Equal(MotivoRevogacaoSessao.Rotacao, reused.MotivoRevogacao);
        Assert.Equal(
            MotivoRevogacaoSessao.ReutilizacaoDetectada,
            successor.MotivoRevogacao);
        var audit = Assert.Single(fixture.UserStore.Saves);
        Assert.Equal(AuthenticationAuditOutcome.TokenReuseDetected, audit?.Outcome);
    }

    [Fact]
    public async Task RenewRevokesFamilyWhenProfileIsInactive()
    {
        var fixture = new Fixture();
        var current = fixture.CreateSession(FixedNow.UtcDateTime.AddMinutes(-5));
        fixture.SessionStore.Found = fixture.Wrap(current, profileIsActive: false);
        fixture.SessionStore.Family = [current];

        var result = await fixture.Service.RenewAsync(
            "current-token",
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Equal(MotivoRevogacaoSessao.ContaDesativada, current.MotivoRevogacao);
        var audit = Assert.Single(fixture.UserStore.Saves);
        Assert.Equal(AuthenticationAuditOutcome.SessionRevoked, audit?.Outcome);
    }

    [Fact]
    public async Task RenewRevokesExpiredTemporaryCredentialSession()
    {
        var fixture = new Fixture(temporaryCredentialExpiresAt: FixedNow.UtcDateTime);
        var current = fixture.CreateSession(FixedNow.UtcDateTime.AddMinutes(-5));
        fixture.SessionStore.Found = fixture.Wrap(current);
        fixture.SessionStore.Family = [current];

        var result = await fixture.Service.RenewAsync(
            "current-token",
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Equal(MotivoRevogacaoSessao.Expiracao, current.MotivoRevogacao);
        Assert.Single(fixture.UserStore.Saves);
        Assert.Null(fixture.UserStore.Saves[0]);
    }

    [Fact]
    public async Task RenewRevokesSessionAfterInactivityTimeout()
    {
        var fixture = new Fixture();
        var current = fixture.CreateSession(FixedNow.UtcDateTime.AddMinutes(-16));
        fixture.SessionStore.Found = fixture.Wrap(current);

        var result = await fixture.Service.RenewAsync(
            "current-token",
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Equal(MotivoRevogacaoSessao.Expiracao, current.MotivoRevogacao);
        Assert.Single(fixture.UserStore.Saves);
    }

    [Fact]
    public async Task EndIgnoresInvalidTokenWithoutOpeningTransaction()
    {
        var fixture = new Fixture();

        await fixture.Service.EndAsync(
            new string('a', 513),
            TestContext.Current.CancellationToken);

        Assert.Equal(0, fixture.SessionStore.TransactionCalls);
        Assert.Equal(0, fixture.RefreshTokens.HashCalls);
    }

    [Fact]
    public async Task EndDoesNothingWhenSessionDoesNotExist()
    {
        var fixture = new Fixture();

        await fixture.Service.EndAsync(
            "unknown-token",
            TestContext.Current.CancellationToken);

        Assert.Equal(1, fixture.SessionStore.TransactionCalls);
        Assert.Empty(fixture.UserStore.Saves);
    }

    [Fact]
    public async Task EndRevokesWholeFamilyAndAuditsLogout()
    {
        var fixture = new Fixture();
        var current = fixture.CreateSession(FixedNow.UtcDateTime.AddMinutes(-5));
        var sibling = fixture.CreateSession(
            FixedNow.UtcDateTime.AddMinutes(-4),
            current.FamiliaId,
            "sibling-hash");
        fixture.SessionStore.Found = fixture.Wrap(current);
        fixture.SessionStore.Family = [current, sibling];

        await fixture.Service.EndAsync(
            "current-token",
            TestContext.Current.CancellationToken);

        Assert.All(
            fixture.SessionStore.Family,
            session => Assert.Equal(MotivoRevogacaoSessao.Logout, session.MotivoRevogacao));
        var audit = Assert.Single(fixture.UserStore.Saves);
        Assert.Equal(AuthenticationAuditOutcome.LogoutSucceeded, audit?.Outcome);
        Assert.Equal(fixture.User.Id, audit?.UserId);
        Assert.Equal(FixedNow.UtcDateTime, audit?.OccurredAtUtc);
    }

    private sealed class Fixture
    {
        private readonly AuthenticationSessionPolicy policy = new(
            TimeSpan.FromMinutes(15),
            TimeSpan.FromHours(12));

        public Fixture(DateTime? temporaryCredentialExpiresAt = null)
        {
            User = new Usuario(
                "operator@example.test",
                "password-hash",
                pessoaId: 1,
                perfilId: 1,
                trocaSenhaObrigatoria: temporaryCredentialExpiresAt.HasValue,
                credencialTemporariaExpiraEm: temporaryCredentialExpiresAt);
            typeof(Usuario)
                .GetProperty(nameof(Usuario.Id), BindingFlags.Instance | BindingFlags.Public)!
                .SetValue(User, 7);

            Service = new AuthenticationSessionService(
                SessionStore,
                UserStore,
                RefreshTokens,
                new FakeAccessTokenService(),
                policy,
                new FixedTimeProvider(FixedNow));
        }

        public Usuario User { get; }
        public FakeSessionStore SessionStore { get; } = new();
        public FakeUserStore UserStore { get; } = new();
        public FakeRefreshTokenService RefreshTokens { get; } = new();
        public AuthenticationSessionService Service { get; }

        public SessaoAutenticacao CreateSession(
            DateTime createdAt,
            Guid? familyId = null,
            string tokenHash = "current-hash") =>
            new(
                User.Id,
                familyId ?? Guid.NewGuid(),
                tokenHash,
                createdAt,
                createdAt.Add(policy.AbsoluteLifetime));

        public AuthenticationSession Wrap(
            SessaoAutenticacao session,
            bool profileIsActive = true) =>
            new(session, User, "Porteiro", profileIsActive);
    }

    private sealed class FakeSessionStore : IAuthenticationSessionStore
    {
        public int TransactionCalls { get; private set; }
        public string? LastTokenHash { get; private set; }
        public AuthenticationSession? Found { get; set; }
        public IReadOnlyList<SessaoAutenticacao> Family { get; set; } = [];
        public SessaoAutenticacao? AddedSession { get; private set; }

        public void Add(SessaoAutenticacao session) => AddedSession = session;

        public Task<AuthenticationSession?> FindByTokenHashForUpdateAsync(
            string tokenHash,
            CancellationToken cancellationToken)
        {
            LastTokenHash = tokenHash;
            return Task.FromResult(Found);
        }

        public Task<IReadOnlyList<SessaoAutenticacao>> FindFamilyForUpdateAsync(
            Guid familyId,
            CancellationToken cancellationToken) => Task.FromResult(Family);

        public Task<IReadOnlyList<SessaoAutenticacao>> FindForUserForUpdateAsync(
            int userId,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<SessaoAutenticacao>>([]);

        public async Task<TResult> ExecuteInTransactionAsync<TResult>(
            Func<CancellationToken, Task<TResult>> operation,
            CancellationToken cancellationToken)
        {
            TransactionCalls++;
            return await operation(cancellationToken);
        }
    }

    private sealed class FakeUserStore : IAuthenticationUserStore
    {
        public List<AuthenticationAudit?> Saves { get; } = [];

        public Task<AuthenticationUser?> FindByEmailAsync(
            string normalizedEmail,
            CancellationToken cancellationToken) =>
            Task.FromResult<AuthenticationUser?>(null);

        public Task<GoogleAuthenticationLookup> FindForGoogleAuthenticationAsync(
            string subject,
            string normalizedEmail,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<bool> IsAuthenticationStateValidAsync(
            int userId,
            int credentialVersion,
            CancellationToken cancellationToken) => Task.FromResult(true);

        public Task SaveChangesAsync(
            AuthenticationAudit? audit,
            CancellationToken cancellationToken)
        {
            Saves.Add(audit);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeRefreshTokenService : IRefreshTokenService
    {
        public int HashCalls { get; private set; }

        public RefreshToken Create() => new("successor-token", "successor-hash");

        public string ComputeHash(string token)
        {
            HashCalls++;
            return $"hash::{token}";
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
            new("access-token", FixedNow.UtcDateTime.AddMinutes(15));
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
