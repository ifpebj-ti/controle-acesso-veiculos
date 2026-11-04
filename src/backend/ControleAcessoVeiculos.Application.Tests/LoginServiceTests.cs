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

    [Theory]
    [InlineData(ProfileNames.Doorman)]
    [InlineData(ProfileNames.SecurityGuard)]
    [InlineData(ProfileNames.TransportationDepartment)]
    public async Task ExactTemporaryTestAccountCanLoginWithItsOriginalProfile(string profile)
    {
        var store = new FakeUserStore(new(CreateUser("professor@example.test"), profile, true));
        var sessions = new FakeSessionStore();
        var deadline = FixedNow.AddHours(1).UtcDateTime;
        var policy = new HomologationPasswordAccessPolicy(["professor@example.test"], deadline);
        var result = await CreateService(store, sessions, true, policy).AuthenticateAsync(
            "professor@example.test", "valid-password", TestContext.Current.CancellationToken);
        Assert.True(result.IsSuccess);
        Assert.Equal(profile, result.User!.ProfileName);
        Assert.Equal(deadline, sessions.AddedSession!.ExpiraEm);
    }

    [Theory]
    [InlineData("other@example.test", 60)]
    [InlineData("professor@example.test", 0)]
    [InlineData("professor@example.test", -1)]
    public async Task MissingOrExpiredExceptionKeepsGoogleBoundary(string email, int minutes)
    {
        var store = new FakeUserStore(new(CreateUser(email), ProfileNames.Doorman, true));
        var sessions = new FakeSessionStore();
        var policy = new HomologationPasswordAccessPolicy(["professor@example.test"], FixedNow.AddMinutes(minutes).UtcDateTime);
        var result = await CreateService(store, sessions, true, policy).AuthenticateAsync(
            email, "valid-password", TestContext.Current.CancellationToken);
        Assert.False(result.IsSuccess);
        Assert.Null(sessions.AddedSession);
        Assert.True(store.DummyVerificationPerformed);
    }

    [Fact]
    public async Task WrongPasswordAndInactiveProfileAreNotBypassedByException()
    {
        var policy = new HomologationPasswordAccessPolicy(["professor@example.test"], FixedNow.AddHours(1).UtcDateTime);
        var sessions = new FakeSessionStore();
        var store = new FakeUserStore(new(CreateUser("professor@example.test"), ProfileNames.Doorman, true))
        { VerificationResult = PasswordHashVerificationResult.Failed };
        var result = await CreateService(store, sessions, true, policy).AuthenticateAsync(
            "professor@example.test", "wrong-password", TestContext.Current.CancellationToken);
        Assert.False(result.IsSuccess);
        Assert.Null(sessions.AddedSession);
        store = new FakeUserStore(new(CreateUser("professor@example.test"), ProfileNames.Doorman, false));
        result = await CreateService(store, sessions, true, policy).AuthenticateAsync(
            "professor@example.test", "valid-password", TestContext.Current.CancellationToken);
        Assert.False(result.IsSuccess);
        Assert.Null(sessions.AddedSession);
    }

    private static LoginService CreateService(
        FakeUserStore store,
        FakeSessionStore sessions,
        bool operationalGoogleOnly,
        HomologationPasswordAccessPolicy? testAccess = null) =>
        new(
            store,
            store,
            new FakeAccessTokenService(),
            new FakeRefreshTokenService(),
            sessions,
            new AuthenticationSessionPolicy(
                TimeSpan.FromMinutes(15),
                TimeSpan.FromHours(12)),
            new AuthenticationMethodPolicy(operationalGoogleOnly, testAccess),
            new FixedTimeProvider(FixedNow));

    private static Usuario CreateUser(string email)
    {
        var user = new Usuario(email, "hash", 1, 1);
        typeof(Usuario)
            .GetProperty(nameof(Usuario.Id), BindingFlags.Instance | BindingFlags.Public)!
            .SetValue(user, 1);
        return user;
    }

    private sealed class FakeUserStore(AuthenticationUser user)
        : IAuthenticationUserStore, IPasswordHashService
    {
        public bool DummyVerificationPerformed { get; private set; }
        public PasswordHashVerificationResult VerificationResult { get; init; } = PasswordHashVerificationResult.Success;

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
            CancellationToken cancellationToken) => Task.CompletedTask;

        public string Hash(string password) => "hash";

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
