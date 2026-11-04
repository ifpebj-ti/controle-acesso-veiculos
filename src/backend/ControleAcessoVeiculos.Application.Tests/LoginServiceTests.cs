using System.Reflection;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class LoginServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 10, 20, 18, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task OperationalLocalAccountIsDeniedWhenGoogleIsRequired()
    {
        var store = new FakeUserStore(new AuthenticationUser(
            CreateUser("operator@example.test"),
            ProfileNames.Doorman,
            ProfileIsActive: true));
        var sessions = new FakeSessionStore();
        var service = CreateService(store, sessions, operationalGoogleOnly: true);

        var result = await service.AuthenticateAsync(
            "operator@example.test",
            "valid-password",
            TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Null(sessions.AddedSession);
        Assert.True(store.DummyVerificationPerformed);
    }

    [Fact]
    public async Task AdministratorLocalAccountRemainsAvailableWhenGoogleIsRequired()
    {
        var store = new FakeUserStore(new AuthenticationUser(
            CreateUser("admin@example.test"),
            ProfileNames.Administrator,
            ProfileIsActive: true));
        var sessions = new FakeSessionStore();
        var service = CreateService(store, sessions, operationalGoogleOnly: true);

        var result = await service.AuthenticateAsync(
            "admin@example.test",
            "valid-password",
            TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.NotNull(sessions.AddedSession);
        Assert.Equal(ProfileNames.Administrator, result.User?.ProfileName);
    }

    [Fact]
    public async Task UnknownAndInactiveProfilesUseDummyVerification()
    {
        var missingStore = new FakeUserStore(null);
        var inactiveStore = new FakeUserStore(new AuthenticationUser(
            CreateUser("inactive@example.test"),
            ProfileNames.Administrator,
            ProfileIsActive: false));

        var missing = await CreateService(
            missingStore,
            new FakeSessionStore(),
            operationalGoogleOnly: false).AuthenticateAsync(
                "missing@example.test",
                "password",
                TestContext.Current.CancellationToken);
        var inactive = await CreateService(
            inactiveStore,
            new FakeSessionStore(),
            operationalGoogleOnly: false).AuthenticateAsync(
                "inactive@example.test",
                "password",
                TestContext.Current.CancellationToken);

        Assert.False(missing.IsSuccess);
        Assert.False(inactive.IsSuccess);
        Assert.True(missingStore.DummyVerificationPerformed);
        Assert.True(inactiveStore.DummyVerificationPerformed);
    }

    [Fact]
    public async Task FailedPasswordPersistsFailureWithoutLockingEarly()
    {
        var user = CreateUser("operator@example.test");
        var store = new FakeUserStore(new AuthenticationUser(
            user,
            ProfileNames.Doorman,
            ProfileIsActive: true))
        {
            VerificationResult = PasswordHashVerificationResult.Failed
        };

        var result = await CreateService(
            store,
            new FakeSessionStore(),
            operationalGoogleOnly: false).AuthenticateAsync(
                user.Email,
                "wrong-password",
                TestContext.Current.CancellationToken);

        Assert.False(result.IsSuccess);
        Assert.Equal(1, user.TentativasFalhas);
        Assert.Null(store.SavedAudit);
    }

    [Fact]
    public async Task FifthFailedPasswordPersistsLockoutAudit()
    {
        var user = CreateUser("operator@example.test");
        for (var attempt = 0; attempt < LoginService.MaximumFailedAttempts - 1; attempt++)
        {
            user.RegistrarTentativaFalha(
                FixedNow.UtcDateTime,
                LoginService.MaximumFailedAttempts,
                LoginService.LockoutDuration);
        }

        var store = new FakeUserStore(new AuthenticationUser(
            user,
            ProfileNames.Doorman,
            ProfileIsActive: true))
        {
            VerificationResult = PasswordHashVerificationResult.Failed
        };

        await CreateService(
            store,
            new FakeSessionStore(),
            operationalGoogleOnly: false).AuthenticateAsync(
                user.Email,
                "wrong-password",
                TestContext.Current.CancellationToken);

        Assert.NotNull(user.BloqueadoAte);
        Assert.Equal(AuthenticationAuditOutcome.AccountLocked, store.SavedAudit?.Outcome);
    }

    [Fact]
    public async Task SuccessfulLoginRehashesPasswordWhenRequired()
    {
        var user = CreateUser("admin@example.test");
        var store = new FakeUserStore(new AuthenticationUser(
            user,
            ProfileNames.Administrator,
            ProfileIsActive: true))
        {
            VerificationResult = PasswordHashVerificationResult.SuccessRehashNeeded
        };

        var result = await CreateService(
            store,
            new FakeSessionStore(),
            operationalGoogleOnly: false).AuthenticateAsync(
                user.Email,
                "valid-password",
                TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal("rehash", user.SenhaHash);
        Assert.Equal(1, store.HashCalls);
        Assert.Equal(AuthenticationAuditOutcome.LoginSucceeded, store.SavedAudit?.Outcome);
    }

    private static LoginService CreateService(
        FakeUserStore store,
        FakeSessionStore sessions,
        bool operationalGoogleOnly) =>
        new(
            store,
            store,
            new FakeAccessTokenService(),
            new FakeRefreshTokenService(),
            sessions,
            new AuthenticationSessionPolicy(
                TimeSpan.FromMinutes(15),
                TimeSpan.FromHours(12)),
            new AuthenticationMethodPolicy(operationalGoogleOnly),
            new FixedTimeProvider(FixedNow));

    private static Usuario CreateUser(string email)
    {
        var user = new Usuario(email, "hash", 1, 1);
        typeof(Usuario)
            .GetProperty(nameof(Usuario.Id), BindingFlags.Instance | BindingFlags.Public)!
            .SetValue(user, 1);
        return user;
    }

    private sealed class FakeUserStore(AuthenticationUser? user)
        : IAuthenticationUserStore, IPasswordHashService
    {
        public bool DummyVerificationPerformed { get; private set; }
        public int HashCalls { get; private set; }
        public AuthenticationAudit? SavedAudit { get; private set; }
        public PasswordHashVerificationResult VerificationResult { get; init; } =
            PasswordHashVerificationResult.Success;

        public Task<AuthenticationUser?> FindByEmailAsync(
            string normalizedEmail,
            CancellationToken cancellationToken) =>
            Task.FromResult<AuthenticationUser?>(user);

        public Task<GoogleAuthenticationLookup> FindForGoogleAuthenticationAsync(
            string subject,
            string normalizedEmail,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<bool> IsAuthenticationStateValidAsync(
            int userId,
            int credentialVersion,
            CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task SaveChangesAsync(
            AuthenticationAudit? audit,
            CancellationToken cancellationToken)
        {
            SavedAudit = audit;
            return Task.CompletedTask;
        }

        public string Hash(string password)
        {
            HashCalls++;
            return "rehash";
        }

        public PasswordHashVerificationResult Verify(
            string passwordHash,
            string password) => VerificationResult;

        public void PerformDummyVerification(string password) =>
            DummyVerificationPerformed = true;
    }

    private sealed class FakeSessionStore : IAuthenticationSessionStore
    {
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
            Task.FromResult<IReadOnlyList<SessaoAutenticacao>>([]);

        public Task<TResult> ExecuteInTransactionAsync<TResult>(
            Func<CancellationToken, Task<TResult>> operation,
            CancellationToken cancellationToken) => operation(cancellationToken);
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

    private sealed class FakeRefreshTokenService : IRefreshTokenService
    {
        public RefreshToken Create() => new("refresh-token", "refresh-hash");

        public string ComputeHash(string token) => "refresh-hash";
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
