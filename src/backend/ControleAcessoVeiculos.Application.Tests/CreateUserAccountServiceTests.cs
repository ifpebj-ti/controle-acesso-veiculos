using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class CreateUserAccountServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 8, 30, 15, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task CreateRejectsInvalidProfileAndShortPassword()
    {
        var store = new FakeUserAccountStore();
        var service = CreateService(store);

        var result = await service.CreateAsync(new CreateUserAccountCommand(
            "Pessoa de Teste",
            "pessoa@example.test",
            "short",
            "PerfilInventado"), actorUserId: 7, cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal(CreateUserAccountStatus.Invalid, result.Status);
        Assert.Contains("password", result.Errors.Keys);
        Assert.Contains("profileName", result.Errors.Keys);
        Assert.Null(store.CapturedPasswordHash);
    }

    [Fact]
    public async Task AdministrativeCreationRejectsAdministratorProvidedPassword()
    {
        const string password = "Test-only-password-123!";
        var store = new FakeUserAccountStore();
        var service = CreateService(store);

        var result = await service.CreateAsync(new CreateUserAccountCommand(
            "Pessoa de Teste",
            "PERSON@example.test",
            password,
            ProfileNames.Doorman), actorUserId: 7, cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal(CreateUserAccountStatus.Invalid, result.Status);
        Assert.Contains("password", result.Errors.Keys);
        Assert.Null(store.CapturedPasswordHash);
    }

    [Fact]
    public async Task BootstrapUsesSystemActorAndExplicitOrigin()
    {
        var store = new FakeUserAccountStore();
        var service = CreateService(store);

        var result = await service.BootstrapAsync(new CreateUserAccountCommand(
            "Administrador Inicial",
            "admin@example.test",
            "Test-only-password-123!",
            ProfileNames.Administrator), TestContext.Current.CancellationToken);

        Assert.Equal(CreateUserAccountStatus.Success, result.Status);
        Assert.Null(store.CapturedAudit?.ActorUserId);
        Assert.Equal(FixedNow.UtcDateTime, store.CapturedAudit?.OccurredAtUtc);
        Assert.Equal(AccountCreationOrigin.Bootstrap, store.CapturedAudit?.Origin);
        Assert.Equal("HASH::Test-only-password-123!", store.CapturedPasswordHash);
        Assert.Null(store.CapturedTemporaryCredentialExpiresAtUtc);
    }

    [Fact]
    public async Task OperationalCreationPreauthorizesGoogleWithoutLocalCredential()
    {
        var store = new FakeUserAccountStore();
        var service = CreateService(store, operationalGoogleOnly: true);

        var result = await service.CreateAsync(new CreateUserAccountCommand(
            "Novo Operador",
            "operator@example.test",
            Password: null,
            ProfileNames.Doorman), actorUserId: 7, cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal(CreateUserAccountStatus.Success, result.Status);
        Assert.Null(result.TemporaryCredential);
        Assert.Null(result.TemporaryCredentialExpiresAtUtc);
        Assert.Null(store.CapturedPasswordHash);
        Assert.Null(store.CapturedTemporaryCredentialExpiresAtUtc);
        Assert.Equal(
            ControleAcessoVeiculos.Domain.Enums.MetodoAutenticacao.Google,
            store.CapturedAuthenticationMethod);
    }

    private static CreateUserAccountService CreateService(
        FakeUserAccountStore store,
        bool operationalGoogleOnly = false) =>
        new(
            store,
            new FakePasswordHashService(),
            new FakeTemporaryCredentialGenerator(),
            new TemporaryCredentialPolicy(TimeSpan.FromMinutes(30)),
            new AuthenticationMethodPolicy(operationalGoogleOnly),
            new FixedTimeProvider(FixedNow));

    private sealed class FakeUserAccountStore : IUserAccountStore
    {
        public string? CapturedEmail { get; private set; }
        public string? CapturedPasswordHash { get; private set; }
        public AccountCreationAudit? CapturedAudit { get; private set; }
        public DateTime? CapturedTemporaryCredentialExpiresAtUtc { get; private set; }
        public ControleAcessoVeiculos.Domain.Enums.MetodoAutenticacao
            CapturedAuthenticationMethod
        { get; private set; }

        public Task<bool> HasAnyUserAsync(CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<CreatedUserAccount?> TryCreateAsync(
            string name,
            string normalizedEmail,
            string? passwordHash,
            string profileName,
            ControleAcessoVeiculos.Domain.Enums.MetodoAutenticacao authenticationMethod,
            DateTime? temporaryCredentialExpiresAtUtc,
            AccountCreationAudit audit,
            CancellationToken cancellationToken)
        {
            CapturedEmail = normalizedEmail;
            CapturedPasswordHash = passwordHash;
            CapturedAudit = audit;
            CapturedTemporaryCredentialExpiresAtUtc = temporaryCredentialExpiresAtUtc;
            CapturedAuthenticationMethod = authenticationMethod;
            return Task.FromResult<CreatedUserAccount?>(
                new CreatedUserAccount(
                    1,
                    normalizedEmail,
                    profileName,
                    authenticationMethod));
        }

        public Task<PagedUserAccountResult> SearchAsync(
            UserAccountSearchCriteria criteria,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<UserAccountStoreStateStatus> TrySetActiveAsync(
            int userId,
            bool active,
            int actorUserId,
            DateTime updatedAtUtc,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<AdministrativeCredentialResetStoreResult> TryResetCredentialAsync(
            int userId,
            int actorUserId,
            string passwordHash,
            DateTime occurredAtUtc,
            DateTime expiresAtUtc,
            string reason,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();
    }

    private sealed class FakeTemporaryCredentialGenerator : ITemporaryCredentialGenerator
    {
        public string Create() => "Generated-temporary-credential-123!";
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakePasswordHashService : IPasswordHashService
    {
        public string Hash(string password) => $"HASH::{password}";
        public PasswordHashVerificationResult Verify(string passwordHash, string password) =>
            PasswordHashVerificationResult.Failed;
        public void PerformDummyVerification(string password)
        {
        }
    }
}
