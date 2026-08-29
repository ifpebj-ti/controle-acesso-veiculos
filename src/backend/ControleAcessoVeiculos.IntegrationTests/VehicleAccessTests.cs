using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class VehicleAccessTests(ApiFactory factory)
{
    [Fact]
    public async Task OperationalUserCanRegisterListAndCloseVehicleAccess()
    {
        const string password = "Test-only-password-123!";
        var (userId, email) = await CreateUserAsync(ProfileNames.Doorman, password);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email, password);
        var suffix = Guid.NewGuid().ToString("N");
        var documentNumber = suffix[..11];
        var request = new
        {
            driverName = $"Condutor {suffix}",
            plate = "abc-1d23",
            objective = "Visita técnica",
            categoryName = AccessCategoryNames.Visitor,
            documentType = "CPF",
            documentNumber,
            vehicleType = "Automóvel",
            color = "Prata"
        };

        var entryResponse = await client.PostAsJsonAsync("/access-records/entries", request);
        var entry = await entryResponse.Content.ReadFromJsonAsync<AccessRecordResponse>();

        Assert.Equal(HttpStatusCode.Created, entryResponse.StatusCode);
        Assert.NotNull(entry);
        Assert.Equal("ABC1D23", entry.Plate);
        Assert.Equal("Aberto", entry.Status);
        Assert.Equal(userId, entry.CreatedById);

        var duplicateResponse = await client.PostAsJsonAsync(
            "/access-records/entries",
            request);
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);

        var openRecords = await client.GetFromJsonAsync<List<AccessRecordResponse>>(
            "/access-records/open");
        Assert.Contains(openRecords!, item => item.Id == entry.Id);

        var exitResponse = await client.PostAsync(
            $"/access-records/{entry.Id}/exit",
            content: null);
        var closed = await exitResponse.Content.ReadFromJsonAsync<AccessRecordResponse>();

        Assert.Equal(HttpStatusCode.OK, exitResponse.StatusCode);
        Assert.NotNull(closed);
        Assert.Equal("Encerrado", closed.Status);
        Assert.NotNull(closed.ExitAtUtc);
        Assert.Equal(userId, closed.UpdatedById);

        var secondExit = await client.PostAsync(
            $"/access-records/{entry.Id}/exit",
            content: null);
        Assert.Equal(HttpStatusCode.Conflict, secondExit.StatusCode);

        var missingExit = await client.PostAsync(
            "/access-records/2147483647/exit",
            content: null);
        Assert.Equal(HttpStatusCode.NotFound, missingExit.StatusCode);

        openRecords = await client.GetFromJsonAsync<List<AccessRecordResponse>>(
            "/access-records/open");
        Assert.DoesNotContain(openRecords!, item => item.Id == entry.Id);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.Equal(1, await dbContext.Veiculos.CountAsync(item => item.Placa == "ABC1D23"));
        Assert.Equal(1, await dbContext.Pessoas.CountAsync(
            item => item.DocumentoTipo == "CPF" && item.DocumentoNumero == documentNumber));

        var audits = await dbContext.Auditorias
            .AsNoTracking()
            .Where(item => item.Entidade == nameof(RegistroAcesso) &&
                item.RegistroId == entry.Id)
            .OrderBy(item => item.Id)
            .ToListAsync();

        Assert.Collection(
            audits,
            audit =>
            {
                Assert.Equal(TipoAcaoAuditoria.Inclusao, audit.TipoAcao);
                Assert.Equal(userId, audit.UsuarioId);
                Assert.Null(audit.DadosAnteriores);
                AssertAuditState(audit.DadosNovos, "Aberto");
            },
            audit =>
            {
                Assert.Equal(TipoAcaoAuditoria.Alteracao, audit.TipoAcao);
                Assert.Equal(userId, audit.UsuarioId);
                AssertAuditState(audit.DadosAnteriores, "Aberto");
                AssertAuditState(audit.DadosNovos, "Encerrado");
            });

        var auditContent = string.Join(
            ' ',
            audits.SelectMany(item => new[]
            {
                item.DadosAnteriores,
                item.DadosNovos,
                item.Detalhes
            }).Where(item => item is not null));
        Assert.DoesNotContain(request.driverName, auditContent, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(documentNumber, auditContent, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("ABC1D23", auditContent, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(request.objective, auditContent, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ConcurrentExitAttemptsCloseAndAuditAccessOnlyOnce()
    {
        const string password = "Test-only-password-123!";
        var (userId, email) = await CreateUserAsync(ProfileNames.SecurityGuard, password);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email, password);
        var suffix = Guid.NewGuid().ToString("N");
        var entryResponse = await client.PostAsJsonAsync("/access-records/entries", new
        {
            driverName = $"Condutor {suffix}",
            plate = suffix[..7],
            objective = "Entrega",
            categoryName = AccessCategoryNames.Delivery
        });
        var entry = await entryResponse.Content.ReadFromJsonAsync<AccessRecordResponse>();
        entryResponse.EnsureSuccessStatusCode();
        Assert.NotNull(entry);

        var responses = await Task.WhenAll(
            client.PostAsync($"/access-records/{entry.Id}/exit", content: null),
            client.PostAsync($"/access-records/{entry.Id}/exit", content: null));

        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.OK);
        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Conflict);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.Equal(
            1,
            await dbContext.Auditorias.CountAsync(item =>
                item.Entidade == nameof(RegistroAcesso) &&
                item.RegistroId == entry.Id &&
                item.TipoAcao == TipoAcaoAuditoria.Alteracao &&
                item.UsuarioId == userId));
    }

    [Fact]
    public async Task AuditFailureRollsBackVehicleEntry()
    {
        const string password = "Test-only-password-123!";
        var (_, email) = await CreateUserAsync(ProfileNames.Doorman, password);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email, password);
        var suffix = Guid.NewGuid().ToString("N");
        var plate = suffix[..7].ToUpperInvariant();

        await InstallRejectingAuditTriggerAsync();

        try
        {
            var response = await client.PostAsJsonAsync("/access-records/entries", new
            {
                driverName = $"Condutor {suffix}",
                plate,
                objective = "Visita",
                categoryName = AccessCategoryNames.Visitor
            });

            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }
        finally
        {
            await RemoveRejectingAuditTriggerAsync();
        }

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.False(await dbContext.Veiculos.AnyAsync(item => item.Placa == plate));
    }

    [Fact]
    public async Task AuditFailureRollsBackVehicleExit()
    {
        const string password = "Test-only-password-123!";
        var (_, email) = await CreateUserAsync(ProfileNames.Doorman, password);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, email, password);
        var suffix = Guid.NewGuid().ToString("N");
        var entryResponse = await client.PostAsJsonAsync("/access-records/entries", new
        {
            driverName = $"Condutor {suffix}",
            plate = suffix[..7],
            objective = "Visita",
            categoryName = AccessCategoryNames.Visitor
        });
        var entry = await entryResponse.Content.ReadFromJsonAsync<AccessRecordResponse>();
        entryResponse.EnsureSuccessStatusCode();
        Assert.NotNull(entry);

        await InstallRejectingAuditTriggerAsync();

        try
        {
            var response = await client.PostAsync(
                $"/access-records/{entry.Id}/exit",
                content: null);

            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }
        finally
        {
            await RemoveRejectingAuditTriggerAsync();
        }

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var accessRecord = await dbContext.RegistrosAcesso
            .AsNoTracking()
            .SingleAsync(item => item.Id == entry.Id);
        Assert.Equal(StatusRegistroAcesso.Aberto, accessRecord.Status);
        Assert.Null(accessRecord.DataHoraSaida);
        Assert.Equal(
            1,
            await dbContext.Auditorias.CountAsync(item =>
                item.Entidade == nameof(RegistroAcesso) && item.RegistroId == entry.Id));
    }

    [Fact]
    public async Task AnonymousUserCannotOperateVehicleAccess()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/access-records/open");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
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

        var email = $"access-{suffix}@example.test";
        var user = new Usuario(email, passwordHasher.Hash(password), person.Id, profile.Id);
        dbContext.Usuarios.Add(user);
        await dbContext.SaveChangesAsync();

        return (user.Id, email);
    }

    private async Task InstallRejectingAuditTriggerAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            CREATE OR REPLACE FUNCTION dbo.reject_vehicle_access_audit()
            RETURNS trigger AS $function$
            BEGIN
                RAISE EXCEPTION 'forced integration test audit failure';
            END;
            $function$ LANGUAGE plpgsql;

            CREATE TRIGGER reject_vehicle_access_audit
            BEFORE INSERT ON dbo.auditorias
            FOR EACH ROW
            WHEN (NEW.entidade = 'RegistroAcesso')
            EXECUTE FUNCTION dbo.reject_vehicle_access_audit();
            """);
    }

    private async Task RemoveRejectingAuditTriggerAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            DROP TRIGGER IF EXISTS reject_vehicle_access_audit ON dbo.auditorias;
            DROP FUNCTION IF EXISTS dbo.reject_vehicle_access_audit();
            """);
    }

    private static void AssertAuditState(string? json, string expectedStatus)
    {
        Assert.NotNull(json);
        using var document = JsonDocument.Parse(json);
        Assert.Equal(expectedStatus, document.RootElement.GetProperty("status").GetString());
    }

    private sealed record LoginResponse(string AccessToken, DateTime ExpiresAtUtc);

    private sealed record AccessRecordResponse(
        int Id,
        string Plate,
        string Status,
        DateTime EntryAtUtc,
        DateTime? ExitAtUtc,
        int CreatedById,
        int? UpdatedById);
}
