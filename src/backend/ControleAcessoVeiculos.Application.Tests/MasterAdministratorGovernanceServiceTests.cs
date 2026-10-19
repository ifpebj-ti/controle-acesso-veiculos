using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Application.Authorization;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class MasterAdministratorGovernanceServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 10, 19, 15, 30, 0, TimeSpan.Zero);

    [Fact]
    public async Task InvalidCommandDoesNotReachStore()
    {
        var store = new FakeStore();
        var service = CreateService(store);

        var result = await service.ChangeAuthorizationAsync(
            0,
            7,
            new ChangeUserAuthorizationCommand(
                ProfileNames.Doorman,
                IsMasterAdministrator: true,
                CurrentPassword: string.Empty,
                Reason: "curta"),
            TestContext.Current.CancellationToken);

        Assert.Equal(ChangeUserAuthorizationStatus.Invalid, result.Status);
        Assert.Contains("userId", result.Errors.Keys);
        Assert.Contains("isMasterAdministrator", result.Errors.Keys);
        Assert.Contains("currentPassword", result.Errors.Keys);
        Assert.Contains("reason", result.Errors.Keys);
        Assert.Equal(0, store.Calls);
    }

    [Fact]
    public async Task SelfChangeIsRejectedBeforeStore()
    {
        var store = new FakeStore();
        var service = CreateService(store);

        var result = await service.ChangeAuthorizationAsync(
            7,
            7,
            ValidCommand(),
            TestContext.Current.CancellationToken);

        Assert.Equal(ChangeUserAuthorizationStatus.SelfChange, result.Status);
        Assert.Equal(0, store.Calls);
    }

    [Theory]
    [InlineData(ChangeUserAuthorizationStoreStatus.Success, ChangeUserAuthorizationStatus.Success)]
    [InlineData(ChangeUserAuthorizationStoreStatus.NotFound, ChangeUserAuthorizationStatus.NotFound)]
    [InlineData(ChangeUserAuthorizationStoreStatus.ActorNotAuthorized, ChangeUserAuthorizationStatus.Forbidden)]
    [InlineData(ChangeUserAuthorizationStoreStatus.InvalidStepUp, ChangeUserAuthorizationStatus.InvalidStepUp)]
    [InlineData(ChangeUserAuthorizationStoreStatus.Inactive, ChangeUserAuthorizationStatus.Inactive)]
    [InlineData(ChangeUserAuthorizationStoreStatus.LastMasterAdministrator, ChangeUserAuthorizationStatus.Conflict)]
    public async Task MapsStoreStatusAndUsesServerTime(
        ChangeUserAuthorizationStoreStatus storeStatus,
        ChangeUserAuthorizationStatus expectedStatus)
    {
        var store = new FakeStore(storeStatus);
        var service = CreateService(store);

        var result = await service.ChangeAuthorizationAsync(
            9,
            7,
            ValidCommand(),
            TestContext.Current.CancellationToken);

        Assert.Equal(expectedStatus, result.Status);
        Assert.Equal(1, store.Calls);
        Assert.Equal(FixedNow.UtcDateTime, store.OccurredAtUtc);
        Assert.Equal("Necessidade operacional validada", store.Reason);
        Assert.Equal("Master-password-123!", store.CurrentPassword);
    }

    private static ChangeUserAuthorizationCommand ValidCommand() =>
        new(
            ProfileNames.Administrator,
            IsMasterAdministrator: true,
            CurrentPassword: "Master-password-123!",
            Reason: "  Necessidade operacional validada  ");

    private static MasterAdministratorGovernanceService CreateService(FakeStore store) =>
        new(store, new FixedTimeProvider(FixedNow));

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakeStore(
        ChangeUserAuthorizationStoreStatus status =
            ChangeUserAuthorizationStoreStatus.Success) : IUserAccountStore
    {
        public int Calls { get; private set; }
        public string? CurrentPassword { get; private set; }
        public string? Reason { get; private set; }
        public DateTime? OccurredAtUtc { get; private set; }

        public Task<ChangeUserAuthorizationStoreResult> TryChangeAuthorizationAsync(
            int userId,
            int actorUserId,
            string profileName,
            bool isMasterAdministrator,
            string currentPassword,
            string reason,
            DateTime occurredAtUtc,
            CancellationToken cancellationToken)
        {
            Calls++;
            CurrentPassword = currentPassword;
            Reason = reason;
            OccurredAtUtc = occurredAtUtc;
            return Task.FromResult(new ChangeUserAuthorizationStoreResult(
                status,
                Changed: status == ChangeUserAuthorizationStoreStatus.Success));
        }

        public Task<bool> HasAnyUserAsync(CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<CreatedUserAccount?> TryCreateAsync(
            string name,
            string normalizedEmail,
            string passwordHash,
            string profileName,
            DateTime? temporaryCredentialExpiresAtUtc,
            AccountCreationAudit audit,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();

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
}
