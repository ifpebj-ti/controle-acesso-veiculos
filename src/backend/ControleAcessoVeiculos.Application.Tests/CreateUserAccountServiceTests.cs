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
            "PerfilInventado"),
            actorUserId: 7);

        Assert.Equal(CreateUserAccountStatus.Invalid, result.Status);
        Assert.Contains("password", result.Errors.Keys);
        Assert.Contains("profileName", result.Errors.Keys);
        Assert.Null(store.CapturedPasswordHash);
    }

    [Fact]
    public async Task CreateSendsOnlyPasswordHashToPersistence()
    {
        const string password = "Test-only-password-123!";
        var store = new FakeUserAccountStore();
        var service = CreateService(store);

        var result = await service.CreateAsync(new CreateUserAccountCommand(
            "Pessoa de Teste",
            "PERSON@example.test",
            password,
            ProfileNames.Doorman),
            actorUserId: 7);

        Assert.Equal(CreateUserAccountStatus.Success, result.Status);
        Assert.Equal("person@example.test", store.CapturedEmail);
        Assert.Equal($"HASH::{password}", store.CapturedPasswordHash);
        Assert.NotEqual(password, store.CapturedPasswordHash);
        Assert.Equal(7, store.CapturedAudit?.ActorUserId);
        Assert.Equal(FixedNow.UtcDateTime, store.CapturedAudit?.OccurredAtUtc);
        Assert.Equal(AccountCreationOrigin.Administration, store.CapturedAudit?.Origin);
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
            ProfileNames.Administrator));

        Assert.Equal(CreateUserAccountStatus.Success, result.Status);
        Assert.Null(store.CapturedAudit?.ActorUserId);
        Assert.Equal(FixedNow.UtcDateTime, store.CapturedAudit?.OccurredAtUtc);
        Assert.Equal(AccountCreationOrigin.Bootstrap, store.CapturedAudit?.Origin);
    }

    private static CreateUserAccountService CreateService(FakeUserAccountStore store) =>
        new(store, new FakePasswordHashService(), new FixedTimeProvider(FixedNow));

    private sealed class FakeUserAccountStore : IUserAccountStore
    {
        public string? CapturedEmail { get; private set; }
        public string? CapturedPasswordHash { get; private set; }
        public AccountCreationAudit? CapturedAudit { get; private set; }

        public Task<bool> HasAnyUserAsync(CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<CreatedUserAccount?> TryCreateAsync(
            string name,
            string normalizedEmail,
            string passwordHash,
            string profileName,
            AccountCreationAudit audit,
            CancellationToken cancellationToken)
        {
            CapturedEmail = normalizedEmail;
            CapturedPasswordHash = passwordHash;
            CapturedAudit = audit;
            return Task.FromResult<CreatedUserAccount?>(
                new CreatedUserAccount(1, normalizedEmail, profileName));
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
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakePasswordHashService : IPasswordHashService
    {
        public string Hash(string password) => $"HASH::{password}";
        public bool Verify(string passwordHash, string password) => false;
        public void PerformDummyVerification(string password)
        {
        }
    }
}
