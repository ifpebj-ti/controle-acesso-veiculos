using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class CreateUserAccountServiceTests
{
    [Fact]
    public async Task CreateRejectsInvalidProfileAndShortPassword()
    {
        var store = new FakeUserAccountStore();
        var service = new CreateUserAccountService(store, new FakePasswordHashService());

        var result = await service.CreateAsync(new CreateUserAccountCommand(
            "Pessoa de Teste",
            "pessoa@example.test",
            "short",
            "PerfilInventado"));

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
        var service = new CreateUserAccountService(store, new FakePasswordHashService());

        var result = await service.CreateAsync(new CreateUserAccountCommand(
            "Pessoa de Teste",
            "PERSON@example.test",
            password,
            ProfileNames.Doorman));

        Assert.Equal(CreateUserAccountStatus.Success, result.Status);
        Assert.Equal("person@example.test", store.CapturedEmail);
        Assert.Equal($"HASH::{password}", store.CapturedPasswordHash);
        Assert.NotEqual(password, store.CapturedPasswordHash);
    }

    private sealed class FakeUserAccountStore : IUserAccountStore
    {
        public string? CapturedEmail { get; private set; }
        public string? CapturedPasswordHash { get; private set; }

        public Task<bool> HasAnyUserAsync(CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<CreatedUserAccount?> TryCreateAsync(
            string name,
            string normalizedEmail,
            string passwordHash,
            string profileName,
            CancellationToken cancellationToken)
        {
            CapturedEmail = normalizedEmail;
            CapturedPasswordHash = passwordHash;
            return Task.FromResult<CreatedUserAccount?>(
                new CreatedUserAccount(1, normalizedEmail, profileName));
        }
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
