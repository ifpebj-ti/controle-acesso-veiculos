using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class AccountProfileSecurityRegressionTests
{
    [Theory]
    [InlineData(0, 2, "Porteiro", "A justified operational change", "userId")]
    [InlineData(1, 0, "Porteiro", "A justified operational change", "actor")]
    [InlineData(1, 2, null, "A justified operational change", "profileName")]
    [InlineData(1, 2, "Unsupported", "A justified operational change", "profileName")]
    [InlineData(1, 2, "Porteiro", null, "reason")]
    [InlineData(1, 2, "Porteiro", "short", "reason")]
    public async Task InvalidChangeDoesNotReachPersistenceOrGenerateCredentials(
        int user, int actor, string? profile, string? reason, string error)
    {
        var store = new RecordingStore();
        var generator = new RecordingGenerator();
        var result = await CreateService(store, generator).ChangeAsync(user, actor, profile, reason, TestContext.Current.CancellationToken);

        Assert.Equal(ChangeAccountProfileStatus.Invalid, result.Status);
        Assert.Contains(error, result.Errors.Keys);
        Assert.Equal(0, store.Calls);
        Assert.Equal(0, generator.Calls);
    }

    [Fact]
    public async Task SelfChangeIsDeniedBeforeAnyStoreOrCredentialOperation()
    {
        var store = new RecordingStore();
        var generator = new RecordingGenerator();
        var result = await CreateService(store, generator).ChangeAsync(1, 1, ProfileNames.Administrator, "A justified operational change", TestContext.Current.CancellationToken);

        Assert.Equal(ChangeAccountProfileStatus.SelfChange, result.Status);
        Assert.Equal(0, store.Calls);
        Assert.Equal(0, generator.Calls);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ProfileControlsAuthenticationMethodAndTemporaryCredentialIssuance(bool administrator)
    {
        var profile = administrator ? ProfileNames.Administrator : ProfileNames.Doorman;
        var method = administrator ? MetodoAutenticacao.Local : MetodoAutenticacao.Google;
        var store = new RecordingStore
        {
            Result = new(ChangeAccountProfileStoreStatus.Success, ProfileNames.TransportationDepartment, profile, method)
        };
        var generator = new RecordingGenerator();
        var result = await CreateService(store, generator).ChangeAsync(1, 2, $" {profile} ", "  A justified operational change  ", TestContext.Current.CancellationToken);

        Assert.Equal(ChangeAccountProfileStatus.Success, result.Status);
        Assert.Equal(method, result.AuthenticationMethod);
        Assert.Equal(method, store.Method);
        Assert.Equal("A justified operational change", store.Reason);
        Assert.Equal(1, store.Calls);
        Assert.Equal(administrator ? 1 : 0, generator.Calls);
        if (administrator)
        {
            Assert.Equal("fictional-temporary-credential", result.TemporaryCredential);
            Assert.Equal("hash::fictional-temporary-credential", store.Hash);
            Assert.NotNull(result.TemporaryCredentialExpiresAtUtc);
            Assert.Equal(store.ExpiresAtUtc, result.TemporaryCredentialExpiresAtUtc);
        }
        else
        {
            Assert.Null(result.TemporaryCredential);
            Assert.Null(result.TemporaryCredentialExpiresAtUtc);
            Assert.Null(store.Hash);
            Assert.Null(store.ExpiresAtUtc);
        }
    }

    [Fact]
    public async Task LastAdministratorDenialDoesNotReturnGeneratedTemporaryCredential()
    {
        var store = new RecordingStore { Result = new(ChangeAccountProfileStoreStatus.LastAdministrator) };
        var result = await CreateService(store, new RecordingGenerator()).ChangeAsync(
            1, 2, ProfileNames.Administrator, "A justified operational change", TestContext.Current.CancellationToken);

        Assert.Equal(ChangeAccountProfileStatus.LastAdministrator, result.Status);
        Assert.Null(result.TemporaryCredential);
        Assert.Null(result.TemporaryCredentialExpiresAtUtc);
    }

    private static ChangeAccountProfileService CreateService(RecordingStore store, RecordingGenerator generator) =>
        new(store, new TestHashService(), generator, new TemporaryCredentialPolicy(TimeSpan.FromMinutes(30)), TimeProvider.System);

    private sealed class RecordingStore : IAccountProfileStore
    {
        public ChangeAccountProfileStoreResult Result { get; init; } = new(ChangeAccountProfileStoreStatus.Conflict);
        public int Calls { get; private set; }
        public MetodoAutenticacao Method { get; private set; }
        public string? Hash { get; private set; }
        public string? Reason { get; private set; }
        public DateTime? ExpiresAtUtc { get; private set; }

        public Task<ChangeAccountProfileStoreResult> TryChangeProfileAsync(int userId, int actorUserId,
            string profileName, MetodoAutenticacao authenticationMethod, string? temporaryPasswordHash,
            DateTime? temporaryCredentialExpiresAtUtc, DateTime occurredAtUtc, string reason, CancellationToken cancellationToken)
        {
            Calls++;
            Method = authenticationMethod;
            Hash = temporaryPasswordHash;
            Reason = reason;
            ExpiresAtUtc = temporaryCredentialExpiresAtUtc;
            return Task.FromResult(Result);
        }
    }

    private sealed class RecordingGenerator : ITemporaryCredentialGenerator
    {
        public int Calls { get; private set; }
        public string Create() { Calls++; return "fictional-temporary-credential"; }
    }

    private sealed class TestHashService : IPasswordHashService
    {
        public string Hash(string password) => $"hash::{password}";
        public PasswordHashVerificationResult Verify(string passwordHash, string password) => throw new NotSupportedException();
        public void PerformDummyVerification(string password) => throw new NotSupportedException();
    }
}
