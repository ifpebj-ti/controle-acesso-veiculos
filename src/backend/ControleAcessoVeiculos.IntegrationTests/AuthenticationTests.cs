using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class AuthenticationTests(ApiFactory factory)
{
    [Fact]
    public async Task ValidCredentialsIssueTokenForProtectedEndpoint()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(ProfileNames.Administrator, password);
        using var client = factory.CreateClient();

        var login = await client.PostAsJsonAsync("/auth/login", new { email, password });
        var body = await login.Content.ReadFromJsonAsync<LoginResponse>();

        login.EnsureSuccessStatusCode();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.AccessToken));
        Assert.True(body.ExpiresAtUtc > DateTime.UtcNow);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.AccessToken);
        var protectedResponse = await client.GetAsync("/weatherforecast");

        protectedResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task InvalidCredentialsReturnGenericUnauthorizedResponse()
    {
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/auth/login", new
        {
            email = $"missing-{Guid.NewGuid():N}@example.test",
            password = "Wrong-password-123!"
        });
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("Credenciais inválidas.", body?.Message);
    }

    [Fact]
    public async Task FiveInvalidAttemptsTemporarilyBlockAccount()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(ProfileNames.Administrator, password);
        using var client = factory.CreateClient();

        for (var attempt = 0; attempt < LoginService.MaximumFailedAttempts; attempt++)
        {
            var invalidResponse = await client.PostAsJsonAsync("/auth/login", new
            {
                email,
                password = "Wrong-password-123!"
            });
            Assert.Equal(HttpStatusCode.Unauthorized, invalidResponse.StatusCode);
        }

        var blockedResponse = await client.PostAsJsonAsync("/auth/login", new
        {
            email,
            password
        });

        Assert.Equal(HttpStatusCode.Unauthorized, blockedResponse.StatusCode);
    }

    [Fact]
    public async Task InactiveUserCannotAuthenticate()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(ProfileNames.Administrator, password, active: false);
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/auth/login", new { email, password });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TransportationProfileCannotUseOperationalPolicy()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(ProfileNames.TransportationDepartment, password);
        using var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/auth/login", new { email, password });
        var body = await login.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(body);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.AccessToken);

        var response = await client.GetAsync("/weatherforecast");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdministratorCanCreateIndividualAccount()
    {
        const string adminPassword = "Test-only-admin-password-123!";
        const string newUserPassword = "Test-only-user-password-123!";
        var adminEmail = await CreateUserAsync(ProfileNames.Administrator, adminPassword);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, adminEmail, adminPassword);
        var suffix = Guid.NewGuid().ToString("N");
        var newUserEmail = $"created-{suffix}@example.test";

        var response = await client.PostAsJsonAsync("/users", new
        {
            name = $"Pessoa Criada {suffix}",
            email = newUserEmail,
            password = newUserPassword,
            profileName = ProfileNames.Doorman
        });
        var created = await response.Content.ReadFromJsonAsync<CreateUserResponse>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(created);
        Assert.Equal(newUserEmail, created.Email);
        Assert.Equal(ProfileNames.Doorman, created.ProfileName);

        using var loginClient = factory.CreateClient();
        var login = await loginClient.PostAsJsonAsync("/auth/login", new
        {
            email = newUserEmail,
            password = newUserPassword
        });
        login.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task NonAdministratorCannotCreateAccount()
    {
        const string password = "Test-only-user-password-123!";
        var email = await CreateUserAsync(ProfileNames.Doorman, password);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email, password);

        var response = await client.PostAsJsonAsync("/users", new
        {
            name = "Conta Não Autorizada",
            email = $"forbidden-{Guid.NewGuid():N}@example.test",
            password,
            profileName = ProfileNames.Doorman
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private static async Task AuthenticateClientAsync(
        HttpClient client,
        string email,
        string password)
    {
        var login = await client.PostAsJsonAsync("/auth/login", new { email, password });
        var body = await login.Content.ReadFromJsonAsync<LoginResponse>();
        login.EnsureSuccessStatusCode();
        Assert.NotNull(body);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.AccessToken);
    }

    private async Task<string> CreateUserAsync(
        string profileName,
        string password,
        bool active = true)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHashService>();
        var suffix = Guid.NewGuid().ToString("N");
        var profile = await dbContext.Perfis.SingleOrDefaultAsync(item => item.Nome == profileName);

        if (profile is null)
        {
            profile = new Perfil(profileName, "Perfil criado exclusivamente para teste de integração.");
            dbContext.Perfis.Add(profile);
        }

        var person = new Pessoa($"Pessoa de Teste {suffix}");
        dbContext.Pessoas.Add(person);
        await dbContext.SaveChangesAsync();

        var email = $"auth-{suffix}@example.test";
        var user = new Usuario(email, passwordHasher.Hash(password), person.Id, profile.Id);

        if (!active)
        {
            user.Desativar(DateTime.UtcNow);
        }

        dbContext.Usuarios.Add(user);
        await dbContext.SaveChangesAsync();
        return email;
    }

    private sealed record LoginResponse(string AccessToken, DateTime ExpiresAtUtc);
    private sealed record CreateUserResponse(int Id, string Email, string ProfileName);
    private sealed record ErrorResponse(string Message);
}
