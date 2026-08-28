using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;
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
