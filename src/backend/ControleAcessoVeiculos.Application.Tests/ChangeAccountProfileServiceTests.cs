using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class ChangeAccountProfileServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2026, 10, 20, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task OperationalProfileUsesGoogleWithoutGeneratingCredential()
    {
        var store = new FakeStore(ChangeAccountProfileStoreStatus.Success);
        var generator = new FakeGenerator();
        var service = CreateService(store, generator);

        var result = await service.ChangeAsync(
            2,
            1,
            ProfileNames.SecurityGuard,
            "Mudança aprovada pelo responsável do setor.",
            TestContext.Current.CancellationToken);

        Assert.Equal(ChangeAccountProfileStatus.Success, result.Status);
        Assert.Equal(MetodoAutenticacao.Google, store.AuthenticationMethod);
        Assert.Null(store.TemporaryPasswordHash);
        Assert.Equal(0, generator.Calls);
    }

    [Fact]
    public async Task AdministratorProfileGeneratesExpiringTemporaryCredential()
    {
        var store = new FakeStore(ChangeAccountProfileStoreStatus.Success);
        var generator = new FakeGenerator();
        var service = CreateService(store, generator);

        var result = await service.ChangeAsync(
            2,
            1,
            ProfileNames.Administrator,
            "Promoção administrativa formalmente autorizada.",
            TestContext.Current.CancellationToken);

        Assert.Equal(ChangeAccountProfileStatus.Success, result.Status);
        Assert.Equal(MetodoAutenticacao.Local, store.AuthenticationMethod);
        Assert.Equal("HASH::Temporary-test-credential-123!", store.TemporaryPasswordHash);
        Assert.Equal(FixedNow.UtcDateTime.AddMinutes(30), store.ExpiresAtUtc);
        Assert.Equal("Temporary-test-credential-123!", result.TemporaryCredential);
        Assert.Equal(1, generator.Calls);
    }

    [Fact]
    public async Task SelfChangeAndInvalidReasonDoNotReachStore()
    {
        var store = new FakeStore(ChangeAccountProfileStoreStatus.Success);
        var service = CreateService(store, new FakeGenerator());

        var selfChange = await service.ChangeAsync(
            1,
            1,
            ProfileNames.Doorman,
            "Alteração de perfil solicitada.",
            TestContext.Current.CancellationToken);
        var invalidReason = await service.ChangeAsync(
            2,
            1,
            ProfileNames.Doorman,
            "curto",
            TestContext.Current.CancellationToken);

        Assert.Equal(ChangeAccountProfileStatus.SelfChange, selfChange.Status);
        Assert.Equal(ChangeAccountProfileStatus.Invalid, invalidReason.Status);
        Assert.Equal(0, store.Calls);
    }

    private static ChangeAccountProfileService CreateService(
        FakeStore store,
        FakeGenerator generator) => new(
            store,
            new FakePasswordHashService(),
            generator,
            new TemporaryCredentialPolicy(TimeSpan.FromMinutes(30)),
            new FixedTimeProvider(FixedNow));

    private sealed class FakeStore(ChangeAccountProfileStoreStatus status)
        : IAccountProfileStore
    {
        public int Calls { get; private set; }
        public MetodoAutenticacao AuthenticationMethod { get; private set; }
        public string? TemporaryPasswordHash { get; private set; }
        public DateTime? ExpiresAtUtc { get; private set; }

        public Task<ChangeAccountProfileStoreResult> TryChangeProfileAsync(
            int userId,
            int actorUserId,
            string profileName,
            MetodoAutenticacao authenticationMethod,
            string? temporaryPasswordHash,
            DateTime? temporaryCredentialExpiresAtUtc,
            DateTime occurredAtUtc,
            string reason,
            CancellationToken cancellationToken)
        {
            Calls++;
            AuthenticationMethod = authenticationMethod;
            TemporaryPasswordHash = temporaryPasswordHash;
            ExpiresAtUtc = temporaryCredentialExpiresAtUtc;
            return Task.FromResult(new ChangeAccountProfileStoreResult(
                status,
                ProfileNames.Doorman,
                profileName,
                authenticationMethod));
        }
    }

    private sealed class FakeGenerator : ITemporaryCredentialGenerator
    {
        public int Calls { get; private set; }

        public string Create()
        {
            Calls++;
            return "Temporary-test-credential-123!";
        }
    }

    private sealed class FakePasswordHashService : IPasswordHashService
    {
        public string Hash(string password) => $"HASH::{password}";

        public PasswordHashVerificationResult Verify(
            string passwordHash,
            string password) => PasswordHashVerificationResult.Failed;

        public void PerformDummyVerification(string password)
        {
        }
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
