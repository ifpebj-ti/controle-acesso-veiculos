using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Application.CampusDrivers;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using ControleAcessoVeiculos.Infrastructure.CampusDrivers;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class CampusDriverTests(ApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;
    private const string Password = "Fictitious-Test-Only-123!";

    [Theory]
    [InlineData(ProfileNames.Doorman)]
    [InlineData(ProfileNames.SecurityGuard)]
    public async Task OperatorsCannotManageRegistry(string role)
    {
        using var client = factory.CreateClient();
        await LoginAsync(client, role);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/campus-drivers", Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/campus-drivers", Request(), Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/campus-drivers/1/vehicles", new { plate = "ABC1D23", vehicleType = "Automóvel" }, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/campus-drivers/1/deactivate", new { }, Ct)).StatusCode);
    }

    [Theory]
    [InlineData(ProfileNames.Administrator)]
    [InlineData(ProfileNames.TransportationDepartment)]
    public async Task ManagersCreateReuseAndDeactivateWithoutCreatingLoginOrExposingBirthDate(string role)
    {
        using var client = factory.CreateClient();
        var actor = await LoginAsync(client, role);
        var request = Request();
        using var beforeScope = factory.Services.CreateScope();
        var beforeDb = beforeScope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var userCount = await beforeDb.Usuarios.CountAsync(Ct);
        var response = await client.PostAsJsonAsync("/campus-drivers", request, Ct);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var record = (await response.Content.ReadFromJsonAsync<CampusDriverRecord>(Ct))!;
        Assert.Equal("Federal", record.Affiliation);
        Assert.Contains("no-store", response.Headers.CacheControl!.ToString());
        var body = await (await client.GetAsync("/campus-drivers?query=" + record.Plate, Ct)).Content.ReadAsStringAsync(Ct);
        Assert.DoesNotContain("birthDate", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(request.BirthDate.ToString("yyyy-MM-dd"), body);
        Assert.DoesNotContain("document", body, StringComparison.OrdinalIgnoreCase);
        var extra = await client.PostAsJsonAsync($"/campus-drivers/{record.PersonId}/vehicles",
            new { plate = TestPlate.From(Guid.NewGuid().ToString("N")), vehicleType = "Motocicleta" }, Ct);
        Assert.Equal(HttpStatusCode.Created, extra.StatusCode);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var person = await db.Pessoas.SingleAsync(x => x.Id == record.PersonId, Ct);
        Assert.Equal(request.BirthDate, person.DataNascimento);
        Assert.Equal(actor, person.CadastroCampusConferidoPorId);
        Assert.Equal(userCount, await db.Usuarios.CountAsync(Ct));
        Assert.Equal(2, await db.PessoasVeiculos.CountAsync(x => x.PessoaId == record.PersonId, Ct));
        var audit = await db.Auditorias.Where(x => x.RegistroId == record.PersonId && x.Entidade == nameof(Pessoa))
            .Select(x => x.DadosNovos).ToListAsync(Ct);
        Assert.Equal(2, audit.Count);
        Assert.All(audit, value => Assert.DoesNotContain(request.BirthDate.ToString("yyyy-MM-dd"), value!));
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync($"/campus-drivers/{record.PersonId}/deactivate", new { }, Ct)).StatusCode);
        db.ChangeTracker.Clear();
        person = await db.Pessoas.SingleAsync(x => x.Id == record.PersonId, Ct);
        Assert.False(person.CadastroCampusAtivo);
        Assert.True(person.Ativo);
        if (role == ProfileNames.Administrator)
        {
            var suggestions = await client.GetFromJsonAsync<List<EntrySuggestion>>("/access-records/entry-suggestions?query=" + record.Plate, Ct);
            Assert.Empty(suggestions!);
        }
    }

    [Fact]
    public async Task AnonymousAndMalformedRequestsAreDenied()
    {
        using var anon = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anon.GetAsync("/campus-drivers", Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anon.GetAsync("/access-records/entry-suggestions?query=ABC", Ct)).StatusCode);
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Administrator);
        foreach (var query in new[] { "?page=0", "?page=2147483647", "?pageSize=101", "?query=%00" })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/campus-drivers" + query, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/access-records/entry-suggestions?query=%00ABC", Ct)).StatusCode);
        foreach (var invalid in new[] { Request() with { BirthDate = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-17) }, Request() with { BirthDateConfirmed = false }, Request() with { Plate = "777777" } })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/campus-drivers", invalid, Ct)).StatusCode);
    }

    [Fact]
    public async Task DuplicateRequiresExplicitReviewAndDoesNotMergeHomonyms()
    {
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Administrator);
        var request = Request();
        var first = await client.PostAsJsonAsync("/campus-drivers", request, Ct);
        var original = (await first.Content.ReadFromJsonAsync<CampusDriverRecord>(Ct))!;
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/campus-drivers", request, Ct)).StatusCode);
        var homonym = await client.PostAsJsonAsync("/campus-drivers", request with { ConfirmPossibleDuplicate = true }, Ct);
        Assert.Equal(HttpStatusCode.Created, homonym.StatusCode);
        var other = (await homonym.Content.ReadFromJsonAsync<CampusDriverRecord>(Ct))!;
        Assert.NotEqual(original.PersonId, other.PersonId);
        Assert.Equal(original.VehicleId, other.VehicleId);
    }

    [Fact]
    public async Task SuggestionsSeparatePermanentRegistryAndSameDayOwnVisits()
    {
        using var client = factory.CreateClient();
        var actor = await LoginAsync(client, ProfileNames.Administrator);
        using var otherClient = factory.CreateClient();
        var other = await LoginAsync(otherClient, ProfileNames.Doorman);
        using var scope = factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<CampusDriverService>();
        var window = service.CurrentWindow();
        var marker = Guid.NewGuid().ToString("N")[..12];
        var permanent = Request() with { Name = "Cadastro " + marker };
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/campus-drivers", permanent, Ct)).StatusCode);
        await SeedVisitAsync(marker + " hoje", actor, window.FromUtc.AddHours(1));
        await SeedVisitAsync(marker + " ontem", actor, window.FromUtc.AddTicks(-1));
        await SeedVisitAsync(marker + " amanhã", actor, window.ToExclusiveUtc);
        await SeedVisitAsync(marker + " outro", other, window.FromUtc.AddHours(1));
        var response = await client.GetAsync("/access-records/entry-suggestions?query=" + marker, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = (await response.Content.ReadFromJsonAsync<List<EntrySuggestion>>(Ct))!;
        Assert.Equal(2, items.Count);
        var registered = Assert.Single(items, x => x.Source == "CampusRegistration");
        Assert.Null(registered.ExpiresAtUtc);
        var daily = Assert.Single(items, x => x.Source == "SameDayVisit");
        Assert.Equal(window.ToExclusiveUtc, daily.ExpiresAtUtc);
        Assert.Equal("Objetivo fictício", daily.PreviousObjective);
        Assert.False(daily.HasOpenAccess);
        var raw = await response.Content.ReadAsStringAsync(Ct);
        Assert.DoesNotContain("birthDate", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("eventAuthorizationId", raw, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("no-store", response.Headers.CacheControl!.ToString());
        var anotherOperator = await otherClient.GetFromJsonAsync<List<EntrySuggestion>>("/access-records/entry-suggestions?query=" + marker, Ct);
        Assert.Equal(2, anotherOperator!.Count);
        Assert.DoesNotContain(anotherOperator, x => x.DriverName.EndsWith("hoje", StringComparison.Ordinal));
    }

    [Fact]
    public async Task AuditFailureRollsBackPersonVehicleAndRelationship()
    {
        using var client = factory.CreateClient();
        var actor = await LoginAsync(client, ProfileNames.Administrator);
        var request = Request();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var options = new DbContextOptionsBuilder<ControleAcessoVeiculosDbContext>()
            .UseNpgsql(db.Database.GetConnectionString()).AddInterceptors(new RejectRegistryAudit()).Options;
        await using (var failing = new ControleAcessoVeiculosDbContext(options))
        {
            var store = new CampusDriverStore(failing);
            await Assert.ThrowsAsync<InvalidOperationException>(() => store.RegisterAsync(request,
                actor, DateTime.UtcNow, DateOnly.FromDateTime(DateTime.UtcNow), Ct));
        }
        Assert.False(await db.Pessoas.AnyAsync(x => x.Nome == request.Name, Ct));
        Assert.False(await db.Veiculos.AnyAsync(x => x.Placa == request.Plate, Ct));
    }

    private sealed class RejectRegistryAudit : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (eventData.Context!.ChangeTracker.Entries<Auditoria>().Any(x =>
                x.State == EntityState.Added && x.Entity.DadosNovos!.Contains("campus-driver-registry", StringComparison.Ordinal)))
                throw new InvalidOperationException("Controlled fictitious audit failure.");
            return ValueTask.FromResult(result);
        }
    }

    private static RegisterCampusDriverCommand Request() => new("Condutor Fictício " + Guid.NewGuid().ToString("N"),
        "Federal", new(1990, 1, 1), true, TestPlate.From(Guid.NewGuid().ToString("N")), "Automóvel");

    private async Task<int> LoginAsync(HttpClient client, string role)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var hash = scope.ServiceProvider.GetRequiredService<IPasswordHashService>();
        var profile = await db.Perfis.SingleOrDefaultAsync(x => x.Nome == role, Ct);
        if (profile is null) { profile = new Perfil(role); db.Perfis.Add(profile); }
        var person = new Pessoa("Operador Fictício " + Guid.NewGuid().ToString("N"));
        db.Pessoas.Add(person);
        await db.SaveChangesAsync(Ct);
        var email = Guid.NewGuid().ToString("N") + "@example.test";
        var user = new Usuario(email, hash.Hash(Password), person.Id, profile.Id);
        db.Usuarios.Add(user);
        await db.SaveChangesAsync(Ct);
        var response = await client.PostAsJsonAsync("/auth/login", new { email, password = Password }, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var token = await response.Content.ReadFromJsonAsync<LoginResponse>(Ct);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token!.AccessToken);
        return user.Id;
    }
    private sealed record LoginResponse(string AccessToken);

    private async Task SeedVisitAsync(string name, int actor, DateTime atUtc)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var person = new Pessoa(name);
        var vehicle = new Veiculo(TestPlate.From(Guid.NewGuid().ToString("N")), "Automóvel", null, false);
        var category = await db.CategoriasAcesso.FirstOrDefaultAsync(x => x.Nome == "Visitante", Ct);
        if (category is null) { category = new CategoriaAcesso("Visitante"); db.CategoriasAcesso.Add(category); }
        db.AddRange(person, vehicle);
        await db.SaveChangesAsync(Ct);
        db.PessoasVeiculos.Add(new PessoaVeiculo(person.Id, vehicle.Id, "Condutor", DateOnly.FromDateTime(atUtc).AddDays(-1)));
        var record = new RegistroAcesso(vehicle.Id, person.Id, category.Id, atUtc, "Objetivo fictício", actor);
        record.RegistrarSaida(atUtc.AddMinutes(1), actor);
        db.RegistrosAcesso.Add(record);
        await db.SaveChangesAsync(Ct);
    }
}
