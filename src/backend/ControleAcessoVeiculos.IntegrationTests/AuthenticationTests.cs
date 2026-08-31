using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
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
        var userId = await GetUserIdAsync(email);
        using var client = factory.CreateClient();

        var login = await client.PostAsJsonAsync("/auth/login", new
        {
            email = $"  {email.ToUpperInvariant()}  ",
            password
        });
        var responseContent = await login.Content.ReadAsStringAsync();
        var body = JsonSerializer.Deserialize<LoginResponse>(
            responseContent,
            JsonSerializerOptions.Web);

        login.EnsureSuccessStatusCode();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.AccessToken));
        Assert.True(body.ExpiresAtUtc > DateTime.UtcNow);
        Assert.Equal(userId, body.User.Id);
        Assert.Equal(email, body.User.Email);
        Assert.Equal(ProfileNames.Administrator, body.User.ProfileName);

        using (var responseJson = JsonDocument.Parse(responseContent))
        {
            var userProperties = responseJson.RootElement
                .GetProperty("user")
                .EnumerateObject()
                .Select(property => property.Name)
                .Order()
                .ToArray();
            Assert.Equal(["email", "id", "profileName"], userProperties);
        }

        var audit = await GetSingleAuthenticationAuditAsync(email);
        Assert.Equal(TipoAcaoAuditoria.Login, audit.TipoAcao);
        Assert.Equal(audit.UsuarioId, audit.RegistroId);
        Assert.Equal(nameof(Usuario), audit.Entidade);
        using (var auditState = JsonDocument.Parse(audit.DadosNovos!))
        {
            Assert.Equal(
                AuthenticationAuditOutcome.LoginSucceeded.ToString(),
                auditState.RootElement.GetProperty("outcome").GetString());
            Assert.False(auditState.RootElement.TryGetProperty("lockedUntilUtc", out _));
        }

        var auditContent = string.Join(' ',
            audit.DadosAnteriores,
            audit.DadosNovos,
            audit.Detalhes);
        Assert.DoesNotContain(email, auditContent, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(password, auditContent, StringComparison.Ordinal);
        Assert.DoesNotContain(body.AccessToken, auditContent, StringComparison.Ordinal);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.AccessToken);
        var protectedResponse = await client.GetAsync("/access-records/open");

        protectedResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task InvalidCredentialsReturnGenericUnauthorizedResponse()
    {
        using var client = factory.CreateClient();
        var auditsBefore = await CountAuthenticationAuditsAsync();

        var response = await client.PostAsJsonAsync("/auth/login", new
        {
            email = $"missing-{Guid.NewGuid():N}@example.test",
            password = "Wrong-password-123!"
        });
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("Credenciais inválidas.", body?.Message);
        Assert.Equal(auditsBefore, await CountAuthenticationAuditsAsync());
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

        var audit = await GetSingleAuthenticationAuditAsync(email);
        using var auditState = JsonDocument.Parse(audit.DadosNovos!);
        Assert.Equal(
            AuthenticationAuditOutcome.AccountLocked.ToString(),
            auditState.RootElement.GetProperty("outcome").GetString());
        Assert.True(auditState.RootElement.GetProperty("lockedUntilUtc").GetDateTime() > DateTime.UtcNow);
        Assert.DoesNotContain(email, audit.DadosNovos, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(password, audit.DadosNovos, StringComparison.Ordinal);
    }

    [Fact]
    public async Task AuditFailureShouldRejectLoginAndRollBackUserState()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(ProfileNames.Administrator, password);
        using var client = factory.CreateClient();
        var failedAttempt = await client.PostAsJsonAsync("/auth/login", new
        {
            email,
            password = "Wrong-password-123!"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, failedAttempt.StatusCode);

        await InstallRejectingAuthenticationAuditTriggerAsync();
        try
        {
            var response = await client.PostAsJsonAsync("/auth/login", new
            {
                email,
                password
            });

            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }
        finally
        {
            await RemoveRejectingAuthenticationAuditTriggerAsync();
        }

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var user = await dbContext.Usuarios.AsNoTracking().SingleAsync(item => item.Email == email);
        Assert.Equal(1, user.TentativasFalhas);
        Assert.Equal(0, await dbContext.Auditorias.CountAsync(item =>
            item.Entidade == nameof(Usuario) &&
            item.RegistroId == user.Id &&
            item.TipoAcao == TipoAcaoAuditoria.Login));
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
    public async Task TransportationProfileCannotOperateVehicleAccess()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(ProfileNames.TransportationDepartment, password);
        using var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/auth/login", new { email, password });
        var body = await login.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(body);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.AccessToken);

        var response = await client.GetAsync("/access-records/open");

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

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var audit = await dbContext.Auditorias.AsNoTracking().SingleAsync(item =>
            item.Entidade == nameof(Usuario) &&
            item.RegistroId == created.Id &&
            item.TipoAcao == TipoAcaoAuditoria.Inclusao);
        Assert.Equal(await GetUserIdAsync(adminEmail), audit.UsuarioId);
        var auditContent = string.Join(' ', audit.DadosAnteriores, audit.DadosNovos, audit.Detalhes);
        Assert.DoesNotContain(newUserEmail, auditContent, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(newUserPassword, auditContent, StringComparison.Ordinal);
        Assert.DoesNotContain("hash", auditContent, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AccountCreationAuditFailureRollsBackPersonAndUser()
    {
        const string adminPassword = "Test-only-admin-password-123!";
        var adminEmail = await CreateUserAsync(ProfileNames.Administrator, adminPassword);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, adminEmail, adminPassword);
        var suffix = Guid.NewGuid().ToString("N");
        var newUserEmail = $"rollback-{suffix}@example.test";

        await InstallRejectingAccountCreationAuditTriggerAsync();
        try
        {
            var response = await client.PostAsJsonAsync("/users", new
            {
                name = $"Pessoa Rollback {suffix}",
                email = newUserEmail,
                password = "Test-only-user-password-123!",
                profileName = ProfileNames.Doorman
            });

            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }
        finally
        {
            await RemoveRejectingAccountCreationAuditTriggerAsync();
        }

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.False(await dbContext.Usuarios.AnyAsync(item => item.Email == newUserEmail));
        Assert.False(await dbContext.Pessoas.AnyAsync(item => item.Email == newUserEmail));
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

    private async Task<Auditoria> GetSingleAuthenticationAuditAsync(string email)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var userId = await dbContext.Usuarios
            .Where(item => item.Email == email)
            .Select(item => item.Id)
            .SingleAsync();

        return await dbContext.Auditorias.AsNoTracking().SingleAsync(item =>
            item.Entidade == nameof(Usuario) &&
            item.RegistroId == userId &&
            item.TipoAcao == TipoAcaoAuditoria.Login);
    }

    private async Task<int> CountAuthenticationAuditsAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        return await dbContext.Auditorias.CountAsync(item =>
            item.Entidade == nameof(Usuario) &&
            item.TipoAcao == TipoAcaoAuditoria.Login);
    }

    private async Task<int> GetUserIdAsync(string email)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        return await dbContext.Usuarios
            .Where(item => item.Email == email)
            .Select(item => item.Id)
            .SingleAsync();
    }

    private async Task InstallRejectingAccountCreationAuditTriggerAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE OR REPLACE FUNCTION dbo.reject_account_creation_audit()
            RETURNS trigger AS $$
            BEGIN
                IF NEW.entidade = 'Usuario' AND NEW.tipo_acao = 'Inclusao' THEN
                    RAISE EXCEPTION 'account creation audit rejected for integration test';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER reject_account_creation_audit_trigger
            BEFORE INSERT ON dbo.auditorias
            FOR EACH ROW EXECUTE FUNCTION dbo.reject_account_creation_audit();
            """);
    }

    private async Task RemoveRejectingAccountCreationAuditTriggerAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("""
            DROP TRIGGER IF EXISTS reject_account_creation_audit_trigger ON dbo.auditorias;
            DROP FUNCTION IF EXISTS dbo.reject_account_creation_audit();
            """);
    }

    private async Task InstallRejectingAuthenticationAuditTriggerAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE OR REPLACE FUNCTION dbo.reject_authentication_audit()
            RETURNS trigger AS $$
            BEGIN
                IF NEW.entidade = 'Usuario' AND NEW.tipo_acao = 'Login' THEN
                    RAISE EXCEPTION 'authentication audit rejected for integration test';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER reject_authentication_audit_trigger
            BEFORE INSERT ON dbo.auditorias
            FOR EACH ROW EXECUTE FUNCTION dbo.reject_authentication_audit();
            """);
    }

    private async Task RemoveRejectingAuthenticationAuditTriggerAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("""
            DROP TRIGGER IF EXISTS reject_authentication_audit_trigger ON dbo.auditorias;
            DROP FUNCTION IF EXISTS dbo.reject_authentication_audit();
            """);
    }

    private sealed record LoginResponse(
        string AccessToken,
        DateTime ExpiresAtUtc,
        LoginUserResponse User);
    private sealed record LoginUserResponse(int Id, string Email, string ProfileName);
    private sealed record CreateUserResponse(int Id, string Email, string ProfileName);
    private sealed record ErrorResponse(string Message);
}
