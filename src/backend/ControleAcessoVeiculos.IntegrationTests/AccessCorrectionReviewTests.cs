using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class AccessCorrectionReviewTests(ApiFactory factory)
{
    private const string Password = "Test-only-review-451-password-123!";
    private const string Reason = "Correção após conferência dos dados fictícios.";
    private static readonly AccessCorrectionValues Original = new(AccessCategoryNames.Visitor, "Objetivo original", null);
    private static readonly AccessCorrectionValues Proposed = new(AccessCategoryNames.Delivery, "Objetivo corrigido", "Observação fictícia.");

    [Fact]
    public async Task RequestAndApprovalAreIdempotentAndPreserveTheOriginal()
    {
        Assert.True(new AccessCorrectionReviewOptions().RequireApproval);
        using var application = ReviewApplication();
        var (actorId, actor) = await ClientAsync(application, ProfileNames.Doorman);
        using var actorClient = actor;
        var (_, reviewer) = await ClientAsync(application, ProfileNames.TransportationDepartment);
        using var reviewerClient = reviewer;
        var accessId = await SeedAccessAsync(actorId);
        var blocked = await actorClient.PutAsJsonAsync($"/access-records/{accessId}/correction",
            new { objective = Proposed.Objective, categoryName = Proposed.CategoryName, observation = Proposed.Observation, justification = Reason }, cancellationToken: TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, blocked.StatusCode);
        Assert.Contains("CorrectionApprovalRequired", await blocked.Content.ReadAsStringAsync(cancellationToken: TestContext.Current.CancellationToken));

        var command = Command();
        var response = await actorClient.PostAsJsonAsync(SubmitPath(accessId), command, cancellationToken: TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Contains("no-store", response.Headers.CacheControl!.ToString());
        var request = await ReadAsync(response);
        Assert.Equal("Pendente", request.Status);
        Assert.Equal(Original, request.Original);
        Assert.Equal(Proposed, request.Proposed);
        Assert.Equal(request.Id, (await actorClient.GetFromJsonAsync<AccessCorrectionRecord>(
            $"/access-correction-requests/by-key/{command.RequestKey}",
            cancellationToken: TestContext.Current.CancellationToken))!.Id);
        await AssertEffectiveAsync(accessId, Original.Objective);
        var repeated = await actorClient.PostAsJsonAsync(SubmitPath(accessId), command, cancellationToken: TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, repeated.StatusCode);
        Assert.Equal(request.Id, (await ReadAsync(repeated)).Id);

        var approved = await DecideAsync(reviewerClient, request.Id, "Approve");
        Assert.Equal(HttpStatusCode.OK, approved.StatusCode);
        Assert.Equal("Aprovada", (await ReadAsync(approved)).Status);
        await AssertEffectiveAsync(accessId, Proposed.Objective);
        Assert.Equal(HttpStatusCode.OK, (await DecideAsync(reviewerClient, request.Id, "Approve")).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await DecideAsync(reviewerClient, request.Id, "Reject")).StatusCode);
        Assert.Equal(2, await AuditCountAsync(request.Id));
        var persisted = await actorClient.GetFromJsonAsync<AccessCorrectionRecord>($"/access-correction-requests/{request.Id}", cancellationToken: TestContext.Current.CancellationToken);
        Assert.Equal(Original, persisted!.Original);
        Assert.Equal(Proposed, persisted.Proposed);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task RejectionAndCancellationPreserveEvidenceAndDoNotApplyChanges(bool cancel)
    {
        using var application = ReviewApplication();
        var (actorId, actor) = await ClientAsync(application, ProfileNames.SecurityGuard);
        using var actorClient = actor;
        var (_, reviewer) = await ClientAsync(application, ProfileNames.Administrator);
        using var reviewerClient = reviewer;
        var accessId = await SeedAccessAsync(actorId);
        var request = await ReadAsync(await actorClient.PostAsJsonAsync(SubmitPath(accessId), Command(), cancellationToken: TestContext.Current.CancellationToken));
        var response = cancel
            ? await actorClient.PostAsJsonAsync($"/access-correction-requests/{request.Id}/cancellation", new { justification = Reason }, cancellationToken: TestContext.Current.CancellationToken)
            : await DecideAsync(reviewerClient, request.Id, "Reject");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await ReadAsync(response);
        Assert.Equal(cancel ? "Cancelada" : "Rejeitada", result.Status);
        Assert.Equal(Original, result.Original);
        Assert.Equal(Proposed, result.Proposed);
        await AssertEffectiveAsync(accessId, Original.Objective);
        Assert.Equal(HttpStatusCode.Conflict, (await DecideAsync(reviewerClient, request.Id, "Approve")).StatusCode);
    }

    [Theory]
    [InlineData(ProfileNames.Doorman)]
    [InlineData(ProfileNames.SecurityGuard)]
    public async Task OperationalUserCannotReviewOrReadAnotherUsersRequest(string profile)
    {
        using var application = ReviewApplication();
        var (actorId, actor) = await ClientAsync(application, ProfileNames.Doorman);
        using var actorClient = actor;
        var (_, other) = await ClientAsync(application, profile);
        using var otherClient = other;
        var request = await ReadAsync(await actorClient.PostAsJsonAsync(SubmitPath(await SeedAccessAsync(actorId)), Command(), cancellationToken: TestContext.Current.CancellationToken));
        Assert.Equal(HttpStatusCode.Forbidden, (await DecideAsync(otherClient, request.Id, "Approve")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherClient.GetAsync($"/access-correction-requests/{request.Id}", cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherClient.GetAsync(
            $"/access-correction-requests/by-key/{request.RequestKey}",
            cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await otherClient.PostAsJsonAsync(
            $"/access-correction-requests/{request.Id}/cancellation", new { justification = Reason }, cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
        var page = await otherClient.GetFromJsonAsync<AccessCorrectionPage>("/access-correction-requests?status=Pendente&page=1&pageSize=100", cancellationToken: TestContext.Current.CancellationToken);
        Assert.DoesNotContain(page!.Items, item => item.Id == request.Id);
        Assert.All(page.Items, item => Assert.NotEqual(request.RequestedByUserId, item.RequestedByUserId));
    }

    [Theory]
    [InlineData(ProfileNames.Administrator)]
    [InlineData(ProfileNames.TransportationDepartment)]
    public async Task ReviewerCannotApproveOrRejectOwnRequest(string role)
    {
        using var application = ReviewApplication();
        var (actorId, actor) = await ClientAsync(application, role);
        using var actorClient = actor;
        var request = await ReadAsync(await actorClient.PostAsJsonAsync(SubmitPath(await SeedAccessAsync(actorId)), Command(), cancellationToken: TestContext.Current.CancellationToken));
        Assert.Equal(HttpStatusCode.Forbidden, (await DecideAsync(actorClient, request.Id, "Approve")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await DecideAsync(actorClient, request.Id, "Reject")).StatusCode);
        Assert.Equal("Pendente", (await actorClient.GetFromJsonAsync<AccessCorrectionRecord>($"/access-correction-requests/{request.Id}", cancellationToken: TestContext.Current.CancellationToken))!.Status);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ConcurrentRequestsCreateOnlyOnePendingProposal(bool sameKey)
    {
        using var application = ReviewApplication();
        var (actorId, actor) = await ClientAsync(application, ProfileNames.Doorman);
        using var actorClient = actor;
        var accessId = await SeedAccessAsync(actorId);
        var first = Command();
        var second = sameKey ? first : Command();
        var results = await Task.WhenAll(
            actorClient.PostAsJsonAsync(SubmitPath(accessId), first, cancellationToken: TestContext.Current.CancellationToken),
            actorClient.PostAsJsonAsync(SubmitPath(accessId), second, cancellationToken: TestContext.Current.CancellationToken));
        Assert.Single(results, response => response.StatusCode == HttpStatusCode.Created);
        Assert.Single(results, response => response.StatusCode == (sameKey ? HttpStatusCode.OK : HttpStatusCode.Conflict));
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.Equal(1, await db.SolicitacoesCorrecaoAcesso.CountAsync(x => x.RegistroAcessoId == accessId, cancellationToken: TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task ConcurrentReviewersCannotOverwriteTheWinningDecision()
    {
        using var application = ReviewApplication();
        var (actorId, actor) = await ClientAsync(application, ProfileNames.Doorman);
        using var actorClient = actor;
        var (_, first) = await ClientAsync(application, ProfileNames.Administrator);
        using var firstClient = first;
        var (_, second) = await ClientAsync(application, ProfileNames.TransportationDepartment);
        using var secondClient = second;
        var request = await ReadAsync(await actorClient.PostAsJsonAsync(SubmitPath(await SeedAccessAsync(actorId)), Command(), cancellationToken: TestContext.Current.CancellationToken));
        var results = await Task.WhenAll(DecideAsync(firstClient, request.Id, "Approve"), DecideAsync(secondClient, request.Id, "Reject"));
        Assert.Single(results, response => response.StatusCode == HttpStatusCode.OK);
        Assert.Single(results, response => response.StatusCode == HttpStatusCode.Conflict);
        Assert.Equal(2, await AuditCountAsync(request.Id));
    }

    [Fact]
    public async Task StaleAndUnchangedSubmissionsOrReusedKeysWithDifferentPayloadsAreRejected()
    {
        using var application = ReviewApplication();
        var (actorId, actor) = await ClientAsync(application, ProfileNames.Doorman);
        using var actorClient = actor;
        var accessId = await SeedAccessAsync(actorId);
        Assert.Equal(HttpStatusCode.Conflict, (await actorClient.PostAsJsonAsync(SubmitPath(accessId),
            Command() with { Proposed = Original }, cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await actorClient.PostAsJsonAsync(SubmitPath(accessId),
            Command() with { Original = new(Original.CategoryName, "Base antiga", null) }, cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
        var command = Command();
        (await actorClient.PostAsJsonAsync(SubmitPath(accessId), command, cancellationToken: TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Conflict, (await actorClient.PostAsJsonAsync(SubmitPath(accessId),
            command with { Justification = "Outro motivo para a mesma chave." }, cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
    }

    [Fact]
    public async Task ApprovalOfChangedSourceConflictsWithoutApplyingTheProposal()
    {
        using var application = ReviewApplication();
        var (actorId, actor) = await ClientAsync(application, ProfileNames.Doorman);
        using var actorClient = actor;
        var (_, reviewer) = await ClientAsync(application, ProfileNames.Administrator);
        using var reviewerClient = reviewer;
        var accessId = await SeedAccessAsync(actorId);
        var request = await ReadAsync(await actorClient.PostAsJsonAsync(SubmitPath(accessId), Command(), cancellationToken: TestContext.Current.CancellationToken));
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
            var access = await db.RegistrosAcesso.SingleAsync(x => x.Id == accessId, cancellationToken: TestContext.Current.CancellationToken);
            access.CorrigirDados(access.CategoriaAcessoId, "Alteração concorrente fictícia", null, actorId, DateTime.UtcNow);
            await db.SaveChangesAsync(cancellationToken: TestContext.Current.CancellationToken);
        }
        Assert.Equal(HttpStatusCode.Conflict, (await DecideAsync(reviewerClient, request.Id, "Approve")).StatusCode);
        Assert.Equal("Pendente", (await actorClient.GetFromJsonAsync<AccessCorrectionRecord>($"/access-correction-requests/{request.Id}", cancellationToken: TestContext.Current.CancellationToken))!.Status);
        await AssertEffectiveAsync(accessId, "Alteração concorrente fictícia");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task AuditFailureRollsBackSubmissionOrApproval(bool approval)
    {
        using var application = ReviewApplication();
        var (actorId, actor) = await ClientAsync(application, ProfileNames.Doorman);
        using var actorClient = actor;
        var (_, reviewer) = await ClientAsync(application, ProfileNames.Administrator);
        using var reviewerClient = reviewer;
        var accessId = await SeedAccessAsync(actorId);
        var request = approval ? await ReadAsync(await actorClient.PostAsJsonAsync(SubmitPath(accessId), Command(), cancellationToken: TestContext.Current.CancellationToken)) : null;
        await AuditTriggerAsync(true);
        try
        {
            var response = approval ? await DecideAsync(reviewerClient, request!.Id, "Approve")
                : await actorClient.PostAsJsonAsync(SubmitPath(accessId), Command(), cancellationToken: TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }
        finally { await AuditTriggerAsync(false); }
        await AssertEffectiveAsync(accessId, Original.Objective);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        if (approval)
        {
            Assert.Equal(StatusSolicitacaoCorrecao.Pendente, (await db.SolicitacoesCorrecaoAcesso.SingleAsync(x => x.Id == request!.Id, cancellationToken: TestContext.Current.CancellationToken)).Status);
            Assert.Equal(1, await AuditCountAsync(request!.Id));
        }
        else Assert.False(await db.SolicitacoesCorrecaoAcesso.AnyAsync(x => x.RegistroAcessoId == accessId, cancellationToken: TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task ValidationAndAnonymousRequestsCannotReachMutations()
    {
        using var application = ReviewApplication();
        using var anonymous = application.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/access-correction-requests", cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsJsonAsync(SubmitPath(1), Command(), cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
        var (actorId, actor) = await ClientAsync(application, ProfileNames.Doorman);
        using var actorClient = actor;
        var path = SubmitPath(await SeedAccessAsync(actorId));
        foreach (var invalid in new[] { Command() with { RequestKey = Guid.Empty }, Command() with { Justification = "curto" }, Command() with { Proposed = null! } })
            Assert.Equal(HttpStatusCode.BadRequest, (await actorClient.PostAsJsonAsync(path, invalid, cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
        foreach (var query in new[] { "page=0", "pageSize=101", "page=2147483647", "status=Unknown", "status=1" })
            Assert.Equal(HttpStatusCode.BadRequest, (await actorClient.GetAsync($"/access-correction-requests?{query}", cancellationToken: TestContext.Current.CancellationToken)).StatusCode);
    }

    [Fact]
    public async Task MigrationSupportsCleanUpgradeAndDowngradeInAnIsolatedDatabase()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var builder = new NpgsqlConnectionStringBuilder(db.Database.GetConnectionString());
        var databaseName = $"review451_{Guid.NewGuid():N}";
        await using var admin = new NpgsqlConnection(builder.ConnectionString);
        await admin.OpenAsync(cancellationToken: TestContext.Current.CancellationToken);
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", admin)) await create.ExecuteNonQueryAsync(cancellationToken: TestContext.Current.CancellationToken);
        try
        {
            builder.Database = databaseName;
            await using var isolated = new ControleAcessoVeiculosDbContext(
                new DbContextOptionsBuilder<ControleAcessoVeiculosDbContext>().UseNpgsql(builder.ConnectionString).Options);
            var migrations = isolated.Database.GetMigrations().ToArray();
            var migrator = isolated.GetService<IMigrator>();
            await migrator.MigrateAsync(migrations[^2], cancellationToken: TestContext.Current.CancellationToken);
            await migrator.MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);
            Assert.False(await isolated.SolicitacoesCorrecaoAcesso.AnyAsync(cancellationToken: TestContext.Current.CancellationToken));
            await migrator.MigrateAsync(migrations[^2], cancellationToken: TestContext.Current.CancellationToken);
            await migrator.MigrateAsync(cancellationToken: TestContext.Current.CancellationToken);
            Assert.False(await isolated.SolicitacoesCorrecaoAcesso.AnyAsync(cancellationToken: TestContext.Current.CancellationToken));
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", admin);
            await drop.ExecuteNonQueryAsync(cancellationToken: TestContext.Current.CancellationToken);
        }
    }

    private WebApplicationFactory<Program> ReviewApplication() => factory.WithWebHostBuilder(
        builder => builder.UseSetting("AccessCorrections:RequireApproval", "true"));

    private static SubmitAccessCorrectionCommand Command() => new(Guid.NewGuid(), Original, Proposed, Reason);
    private static string SubmitPath(int accessId) => $"/access-records/{accessId}/correction-requests";
    private static Task<HttpResponseMessage> DecideAsync(HttpClient client, int id, string decision) =>
        client.PostAsJsonAsync($"/access-correction-requests/{id}/decision", new { decision, justification = Reason }, cancellationToken: TestContext.Current.CancellationToken);
    private static async Task<AccessCorrectionRecord> ReadAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AccessCorrectionRecord>(cancellationToken: TestContext.Current.CancellationToken))!;
    }

    private async Task<(int Id, HttpClient Client)> ClientAsync(WebApplicationFactory<Program> application, string role)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var profile = await db.Perfis.SingleOrDefaultAsync(x => x.Nome == role, cancellationToken: TestContext.Current.CancellationToken);
        if (profile is null) { profile = new(role, "Perfil fictício de teste."); db.Perfis.Add(profile); }
        var suffix = Guid.NewGuid().ToString("N");
        var person = new Pessoa($"Revisor fictício {suffix}");
        db.Pessoas.Add(person);
        await db.SaveChangesAsync(cancellationToken: TestContext.Current.CancellationToken);
        var user = new Usuario($"review-{suffix}@example.test",
            scope.ServiceProvider.GetRequiredService<IPasswordHashService>().Hash(Password), person.Id, profile.Id);
        db.Usuarios.Add(user);
        await db.SaveChangesAsync(cancellationToken: TestContext.Current.CancellationToken);
        var client = application.CreateClient();
        var login = await client.PostAsJsonAsync("/auth/login", new { email = user.Email, password = Password }, cancellationToken: TestContext.Current.CancellationToken);
        login.EnsureSuccessStatusCode();
        using var data = JsonDocument.Parse(await login.Content.ReadAsStringAsync(cancellationToken: TestContext.Current.CancellationToken));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", data.RootElement.GetProperty("accessToken").GetString());
        return (user.Id, client);
    }

    private async Task<int> SeedAccessAsync(int actorId)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var category = await db.CategoriasAcesso.SingleOrDefaultAsync(x => x.Nome == Original.CategoryName, cancellationToken: TestContext.Current.CancellationToken);
        if (category is null) { category = new(Original.CategoryName, "Categoria fictícia."); db.CategoriasAcesso.Add(category); }
        var vehicle = new Veiculo(TestPlate.From(Guid.NewGuid().ToString("N")), "Automóvel", null, false);
        var person = new Pessoa("Condutor fictício para revisão");
        db.AddRange(vehicle, person);
        await db.SaveChangesAsync(cancellationToken: TestContext.Current.CancellationToken);
        // Keep this fixture outside the rolling periods used by the existing history tests.
        var entryAtUtc = new DateTime(2003, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var access = new RegistroAcesso(vehicle.Id, person.Id, category.Id, entryAtUtc, Original.Objective, actorId);
        db.RegistrosAcesso.Add(access);
        await db.SaveChangesAsync(cancellationToken: TestContext.Current.CancellationToken);
        return access.Id;
    }

    private async Task AssertEffectiveAsync(int id, string expectedObjective)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.Equal(expectedObjective, await db.RegistrosAcesso.Where(x => x.Id == id).Select(x => x.Objetivo).SingleAsync(cancellationToken: TestContext.Current.CancellationToken));
    }

    private async Task<int> AuditCountAsync(int requestId)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        return await db.Auditorias.CountAsync(x => x.Entidade == "SolicitacaoCorrecaoAcesso" && x.RegistroId == requestId, cancellationToken: TestContext.Current.CancellationToken);
    }

    private async Task AuditTriggerAsync(bool install)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var sql = install ? """
            CREATE FUNCTION dbo.reject_review451_audit() RETURNS trigger AS $f$
            BEGIN RAISE EXCEPTION 'forced review audit failure'; END; $f$ LANGUAGE plpgsql;
            CREATE TRIGGER reject_review451_audit BEFORE INSERT ON dbo.auditorias
            FOR EACH ROW WHEN (NEW.entidade = 'SolicitacaoCorrecaoAcesso') EXECUTE FUNCTION dbo.reject_review451_audit();
            """ : """
            DROP TRIGGER IF EXISTS reject_review451_audit ON dbo.auditorias;
            DROP FUNCTION IF EXISTS dbo.reject_review451_audit();
            """;
        await db.Database.ExecuteSqlRawAsync(sql, cancellationToken: TestContext.Current.CancellationToken);
    }
}
