using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class BootstrapAdministratorServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 10, 26, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task BootstrapStopsWhenAnyUserAlreadyExists()
    {
        var store = new FakeUserAccountStore { HasAnyUser = true };
        var service = CreateService(store);

        var status = await service.BootstrapAsync(
            "Initial Administrator",
            "admin@example.test",
            "Secure-test-password-123!",
            TestContext.Current.CancellationToken);

        Assert.Equal(BootstrapAdministratorStatus.AlreadyInitialized, status);
        Assert.Equal(0, store.CreateCalls);
    }

    [Fact]
    public async Task BootstrapCreatesOnlyInitialAdministrator()
    {
        var store = new FakeUserAccountStore
        {
            CreatedAccount = new(
                1,
                "admin@example.test",
                "Administrador",
                MetodoAutenticacao.Local)
        };
        var service = CreateService(store);

        var status = await service.BootstrapAsync(
            " Initial Administrator ",
            " ADMIN@example.test ",
            "Secure-test-password-123!",
            TestContext.Current.CancellationToken);

        Assert.Equal(BootstrapAdministratorStatus.Success, status);
        Assert.Equal(1, store.CreateCalls);
        Assert.Equal("Initial Administrator", store.Name);
        Assert.Equal("admin@example.test", store.Email);
        Assert.Equal("Administrador", store.ProfileName);
        Assert.Equal(MetodoAutenticacao.Local, store.AuthenticationMethod);
        Assert.Equal(AccountCreationOrigin.Bootstrap, store.Audit?.Origin);
        Assert.Null(store.Audit?.ActorUserId);
    }

    [Fact]
    public async Task BootstrapMapsValidationFailureWithoutWritingAccount()
    {
        var store = new FakeUserAccountStore();
        var service = CreateService(store);

        var status = await service.BootstrapAsync(
            "",
            "invalid-email",
            "short",
            TestContext.Current.CancellationToken);

        Assert.Equal(BootstrapAdministratorStatus.Invalid, status);
        Assert.Equal(0, store.CreateCalls);
    }

    [Fact]
    public async Task BootstrapMapsCreationRaceToConflict()
    {
        var store = new FakeUserAccountStore();
        var service = CreateService(store);

        var status = await service.BootstrapAsync(
            "Initial Administrator",
            "admin@example.test",
            "Secure-test-password-123!",
            TestContext.Current.CancellationToken);

        Assert.Equal(BootstrapAdministratorStatus.Conflict, status);
        Assert.Equal(1, store.CreateCalls);
    }

    private static BootstrapAdministratorService CreateService(
        FakeUserAccountStore store)
    {
        var accountService = new CreateUserAccountService(
            store,
            new FakePasswordHashService(),
            new FakeTemporaryCredentialGenerator(),
            new TemporaryCredentialPolicy(TimeSpan.FromMinutes(30)),
            new AuthenticationMethodPolicy(OperationalGoogleOnly: true),
            new FixedTimeProvider(FixedNow));
        return new BootstrapAdministratorService(store, accountService);
    }

    private sealed class FakeUserAccountStore : IUserAccountStore
    {
        public bool HasAnyUser { get; init; }
        public CreatedUserAccount? CreatedAccount { get; init; }
        public int CreateCalls { get; private set; }
        public string? Name { get; private set; }
        public string? Email { get; private set; }
        public string? ProfileName { get; private set; }
        public MetodoAutenticacao? AuthenticationMethod { get; private set; }
        public AccountCreationAudit? Audit { get; private set; }

        public Task<bool> HasAnyUserAsync(CancellationToken cancellationToken) =>
            Task.FromResult(HasAnyUser);

        public Task<CreatedUserAccount?> TryCreateAsync(
            string name,
            string normalizedEmail,
            string? passwordHash,
            string profileName,
            MetodoAutenticacao authenticationMethod,
            DateTime? temporaryCredentialExpiresAtUtc,
            AccountCreationAudit audit,
            CancellationToken cancellationToken)
        {
            CreateCalls++;
            Name = name;
            Email = normalizedEmail;
            ProfileName = profileName;
            AuthenticationMethod = authenticationMethod;
            Audit = audit;
            return Task.FromResult(CreatedAccount);
        }

        public Task<PagedUserAccountResult> SearchAsync(
            UserAccountSearchCriteria criteria,
            CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<UserAccountStoreStateStatus> TrySetActiveAsync(
            int userId,
            bool active,
            int actorUserId,
            DateTime updatedAtUtc,
            CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<AdministrativeCredentialResetStoreResult> TryResetCredentialAsync(
            int userId,
            int actorUserId,
            string passwordHash,
            DateTime occurredAtUtc,
            DateTime expiresAtUtc,
            string reason,
            CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class FakePasswordHashService : IPasswordHashService
    {
        public string Hash(string password) => $"hash::{password}";

        public PasswordHashVerificationResult Verify(
            string passwordHash,
            string password) => throw new NotSupportedException();

        public void PerformDummyVerification(string password) =>
            throw new NotSupportedException();
    }

    private sealed class FakeTemporaryCredentialGenerator : ITemporaryCredentialGenerator
    {
        public string Create() => "Temporary-test-password-123!";
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
