using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class InstitutionalVehicleCatalogTests(ApiFactory factory)
{
    [Fact]
    public async Task TransportationUserCanCreateAndOperationalUserCanListVehicle()
    {
        const string password = "Test-only-password-123!";
        var (transportationUserId, transportationEmail) = await CreateUserAsync(
            ProfileNames.TransportationDepartment,
            password);
        var (_, doormanEmail) = await CreateUserAsync(ProfileNames.Doorman, password);
        using var managementClient = factory.CreateClient();
        await AuthenticateClientAsync(managementClient, transportationEmail, password);
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var plate = $"if-{suffix[..5]}";
        var identification = $" frota-{suffix} ";

        var createResponse = await managementClient.PostAsJsonAsync(
            "/institutional-vehicles",
            new
            {
                plate,
                identification,
                vehicleType = " Automóvel ",
                brand = " Marca Fictícia ",
                model = " Modelo de Teste ",
                color = " Branco ",
                year = 2026
            });
        var created = await createResponse.Content
            .ReadFromJsonAsync<InstitutionalVehicleResponse>();

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.NotNull(created);
        var createdPlate = Assert.IsType<string>(created.Plate);
        var createdIdentification = Assert.IsType<string>(created.Identification);
        Assert.Equal(plate.Replace("-", string.Empty).ToUpperInvariant(), createdPlate);
        Assert.Equal(identification.Trim().ToUpperInvariant(), createdIdentification);
        Assert.Equal("Automóvel", created.VehicleType);

        using var operationalClient = factory.CreateClient();
        await AuthenticateClientAsync(operationalClient, doormanEmail, password);
        var vehicles = await operationalClient
            .GetFromJsonAsync<List<InstitutionalVehicleResponse>>(
                "/institutional-vehicles");

        Assert.Contains(vehicles!, vehicle => vehicle.Id == created.Id);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var audit = await dbContext.Auditorias
            .AsNoTracking()
            .SingleAsync(item => item.Entidade == nameof(Veiculo) &&
                item.RegistroId == created.Id);

        Assert.Equal(TipoAcaoAuditoria.Inclusao, audit.TipoAcao);
        Assert.Equal(transportationUserId, audit.UsuarioId);
        var auditContent = string.Join(' ', audit.DadosNovos, audit.Detalhes);
        Assert.DoesNotContain(createdPlate, auditContent, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(
            createdIdentification,
            auditContent,
            StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CatalogEnforcesAuthenticationAuthorizationAndValidation()
    {
        const string password = "Test-only-password-123!";
        var (_, doormanEmail) = await CreateUserAsync(ProfileNames.Doorman, password);
        using var anonymousClient = factory.CreateClient();

        var anonymousResponse = await anonymousClient.GetAsync("/institutional-vehicles");

        Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);

        using var operationalClient = factory.CreateClient();
        await AuthenticateClientAsync(operationalClient, doormanEmail, password);
        var forbiddenResponse = await operationalClient.PostAsJsonAsync(
            "/institutional-vehicles",
            new { plate = "ABC-1D23", identification = "FROTA-TESTE" });

        Assert.Equal(HttpStatusCode.Forbidden, forbiddenResponse.StatusCode);

        var (_, transportationEmail) = await CreateUserAsync(
            ProfileNames.TransportationDepartment,
            password);
        using var managementClient = factory.CreateClient();
        await AuthenticateClientAsync(managementClient, transportationEmail, password);
        var invalidResponse = await managementClient.PostAsJsonAsync(
            "/institutional-vehicles",
            new { plate = "---", identification = (string?)null, year = 2028 });

        Assert.Equal(HttpStatusCode.BadRequest, invalidResponse.StatusCode);
    }

    [Fact]
    public async Task ConcurrentDuplicateRegistrationsCreateVehicleOnlyOnce()
    {
        const string password = "Test-only-password-123!";
        var (_, email) = await CreateUserAsync(ProfileNames.Administrator, password);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email, password);
        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var request = new
        {
            plate = $"IF{suffix[..5]}",
            identification = $"FROTA-{suffix}",
            vehicleType = "Automóvel"
        };

        var responses = await Task.WhenAll(
            client.PostAsJsonAsync("/institutional-vehicles", request),
            client.PostAsJsonAsync("/institutional-vehicles", request));

        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Created);
        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task AuditFailureRollsBackVehicleCreation()
    {
        const string password = "Test-only-password-123!";
        var (_, email) = await CreateUserAsync(
            ProfileNames.TransportationDepartment,
            password);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email, password);
        var identification = $"ROLLBACK-{Guid.NewGuid():N}".ToUpperInvariant();
        await InstallRejectingAuditTriggerAsync();

        try
        {
            var response = await client.PostAsJsonAsync(
                "/institutional-vehicles",
                new { plate = (string?)null, identification });

            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }
        finally
        {
            await RemoveRejectingAuditTriggerAsync();
        }

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.False(await dbContext.Veiculos
            .AnyAsync(vehicle => vehicle.IdentificacaoVeiculo == identification));
    }

    private async Task<(int UserId, string Email)> CreateUserAsync(
        string profileName,
        string password)
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

        var email = $"fleet-{suffix}@example.test";
        var user = new Usuario(email, passwordHasher.Hash(password), person.Id, profile.Id);
        dbContext.Usuarios.Add(user);
        await dbContext.SaveChangesAsync();

        return (user.Id, email);
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

    private async Task InstallRejectingAuditTriggerAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            CREATE OR REPLACE FUNCTION dbo.reject_vehicle_catalog_audit()
            RETURNS trigger AS $function$
            BEGIN
                RAISE EXCEPTION 'forced integration test audit failure';
            END;
            $function$ LANGUAGE plpgsql;

            CREATE TRIGGER reject_vehicle_catalog_audit
            BEFORE INSERT ON dbo.auditorias
            FOR EACH ROW
            WHEN (NEW.entidade = 'Veiculo')
            EXECUTE FUNCTION dbo.reject_vehicle_catalog_audit();
            """);
    }

    private async Task RemoveRejectingAuditTriggerAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            DROP TRIGGER IF EXISTS reject_vehicle_catalog_audit ON dbo.auditorias;
            DROP FUNCTION IF EXISTS dbo.reject_vehicle_catalog_audit();
            """);
    }

    private sealed record LoginResponse(string AccessToken, DateTime ExpiresAtUtc);

    private sealed record InstitutionalVehicleResponse(
        int Id,
        string? Plate,
        string? Identification,
        string? VehicleType,
        string? Brand,
        string? Model,
        string? Color,
        int? Year,
        DateTime CreatedAtUtc);
}
