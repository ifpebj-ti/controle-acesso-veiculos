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
public sealed class AdministrativeReportTests(ApiFactory factory)
{
    private const string Password = "Test-only-password-123!";

    [Fact]
    public async Task AdministratorCanReadEmptyReportsAndConsultationIsAudited()
    {
        var (administratorId, email) = await CreateUserAsync(ProfileNames.Administrator);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email);

        var movementResponse = await client.GetAsync(
            "/reports/vehicle-movements?from=2001-01-01&to=2001-01-02",
            TestContext.Current.CancellationToken);
        var fleetResponse = await client.GetAsync(
            "/reports/institutional-fleet?from=2001-01-01&to=2001-01-02",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, movementResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, fleetResponse.StatusCode);

        var movement = await movementResponse.Content.ReadFromJsonAsync<ReportResponse>(
            cancellationToken: TestContext.Current.CancellationToken);
        var fleet = await fleetResponse.Content.ReadFromJsonAsync<ReportResponse>(
            cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(movement);
        Assert.NotNull(fleet);
        Assert.Empty(movement.Items);
        Assert.Empty(fleet.Items);
        Assert.Equal("America/Recife", movement.TimeZoneId);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var auditCount = await dbContext.Auditorias.CountAsync(
            audit => audit.Entidade == "AdministrativeReport" &&
                audit.UsuarioId == administratorId,
            TestContext.Current.CancellationToken);
        Assert.Equal(2, auditCount);
    }

    [Fact]
    public async Task NonAdministratorCannotReadReports()
    {
        var (_, email) = await CreateUserAsync(ProfileNames.TransportationDepartment);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email);

        var response = await client.GetAsync(
            "/reports/vehicle-movements?from=2001-01-01&to=2001-01-02",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task InvalidReportPeriodReturnsValidationProblemWithoutAudit()
    {
        var (administratorId, email) = await CreateUserAsync(ProfileNames.Administrator);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email);

        var response = await client.GetAsync(
            "/reports/vehicle-movements?from=2026-01-01&to=2026-02-01",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.False(await dbContext.Auditorias.AnyAsync(
            audit => audit.Entidade == "AdministrativeReport" &&
                audit.UsuarioId == administratorId,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task MovementReportResolvesCanonicalActorAndOmitsSensitiveDocument()
    {
        var actorName = $"Administrador Relatório {Guid.NewGuid():N}";
        var (administratorId, email) = await CreateUserAsync(
            ProfileNames.Administrator,
            actorName);
        var sensitiveDocument = $"DOC-{Guid.NewGuid():N}"[..20];

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider
                .GetRequiredService<ControleAcessoVeiculosDbContext>();
            var driver = new Pessoa(
                "Condutor de teste",
                "OUTRO",
                sensitiveDocument);
            var vehicle = new Veiculo(
                $"R{Guid.NewGuid():N}"[..7],
                "Automóvel",
                null,
                false);
            var category = new CategoriaAcesso($"Categoria {Guid.NewGuid():N}");
            dbContext.AddRange(driver, vehicle, category);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
            var accessRecord = new RegistroAcesso(
                vehicle.Id,
                driver.Id,
                category.Id,
                new DateTime(2002, 5, 10, 12, 0, 0, DateTimeKind.Utc),
                "Visita técnica",
                administratorId);
            accessRecord.RegistrarSaida(
                new DateTime(2002, 5, 10, 13, 0, 0, DateTimeKind.Utc),
                administratorId);
            dbContext.RegistrosAcesso.Add(accessRecord);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email);
        var response = await client.GetAsync(
            "/reports/vehicle-movements?from=2002-05-10&to=2002-05-10",
            TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(actorName, body, StringComparison.Ordinal);
        Assert.Contains(ProfileNames.Administrator, body, StringComparison.Ordinal);
        Assert.DoesNotContain(sensitiveDocument, body, StringComparison.Ordinal);
    }

    private async Task<(int UserId, string Email)> CreateUserAsync(
        string profileName,
        string? personName = null)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var passwordHasher = scope.ServiceProvider
            .GetRequiredService<IPasswordHashService>();
        var profile = await dbContext.Perfis.SingleOrDefaultAsync(item => item.Nome == profileName);
        if (profile is null)
        {
            profile = new Perfil(
                profileName,
                "Perfil criado exclusivamente para teste de integração.");
            dbContext.Perfis.Add(profile);
        }

        var suffix = Guid.NewGuid().ToString("N");
        var person = new Pessoa(personName ?? $"Usuário Relatório {suffix}");
        dbContext.Pessoas.Add(person);
        await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        var email = $"report-{suffix}@example.test";
        var user = new Usuario(
            email,
            passwordHasher.Hash(Password),
            person.Id,
            profile.Id);
        dbContext.Usuarios.Add(user);
        await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        return (user.Id, email);
    }

    private static async Task AuthenticateClientAsync(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync(
            "/auth/login",
            new { email, password = Password },
            TestContext.Current.CancellationToken);
        var login = await response.Content.ReadFromJsonAsync<LoginResponse>(
            cancellationToken: TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        Assert.NotNull(login);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", login.AccessToken);
    }

    private sealed record LoginResponse(string AccessToken);

    private sealed record ReportResponse(
        IReadOnlyList<object> Items,
        string TimeZoneId);
}
