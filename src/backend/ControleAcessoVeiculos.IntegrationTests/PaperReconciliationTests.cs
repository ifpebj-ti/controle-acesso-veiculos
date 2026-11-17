using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ControleAcessoVeiculos.API.Endpoints;
using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Application.Contingency;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.AccessRecords;
using ControleAcessoVeiculos.Infrastructure.Contingency;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class PaperReconciliationTests(ApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;
    private const string Password = "Fictitious-Paper-Test-123!";
    private const string Reason = "Conferência da folha fictícia concluída.";
    [Theory]
    [InlineData(ProfileNames.Doorman, false)]
    [InlineData(ProfileNames.SecurityGuard, true)]
    [InlineData(ProfileNames.Administrator, false)]
    [InlineData(ProfileNames.TransportationDepartment, true)]
    public async Task ImportPreservesTimesAndReturnsOriginalReceiptOnReplay(string profile, bool closed)
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        var actor = await LoginAsync(client, profile);
        var request = Request(incident.IncidentId, closed);
        var first = await ImportAsync(client, request);
        var repeated = await ImportAsync(client, request);
        Assert.Equal(first, repeated);
        Assert.Equal("Pendente", first.ReviewStatus);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var access = await db.RegistrosAcesso.SingleAsync(x => x.Id == first.AccessRecordId, Ct);
        var row = await db.ReconciliacoesContingencia.SingleAsync(x => x.RegistroAcessoId == access.Id, Ct);
        var observed = DateTimeOffset.Parse(request.ObservedEntryAt).UtcDateTime;
        Assert.Equal(observed.AddTicks(-(observed.Ticks % 10)), access.DataHoraEntrada);
        Assert.Equal(closed ? StatusRegistroAcesso.Encerrado : StatusRegistroAcesso.Aberto, access.Status);
        Assert.Equal(actor, row.DigitadoPorId);
        Assert.Equal(request.PaperAuthorReference, row.ReferenciaAutorPapel);
        Assert.True(row.DigitadoEmUtc > row.EntradaObservadaUtc);
        Assert.Equal(first.ImportedAtUtc, row.DigitadoEmUtc);
        Assert.Equal(1, await db.Auditorias.CountAsync(x => x.Entidade == nameof(ReconciliacaoContingencia) &&
            x.RegistroId == access.Id && x.Detalhes == "paper_imported", Ct));
        var accessAudits = await db.Auditorias.Where(x => x.Entidade == nameof(RegistroAcesso) && x.RegistroId == access.Id).ToListAsync(Ct);
        Assert.All(accessAudits, audit => Assert.True(audit.DataHora > access.DataHoraEntrada));
        using var auditPayload = System.Text.Json.JsonDocument.Parse(Assert.Single(accessAudits).DadosNovos!);
        Assert.Equal(access.Status.ToString(), auditPayload.RootElement.GetProperty("status").GetString());
        if (!closed)
        {
            var open = await client.GetFromJsonAsync<List<VehicleAccessRecord>>("/access-records/open", Ct);
            Assert.Equal("Pendente", Assert.Single(open!, x => x.Id == access.Id).PaperReviewStatus);
            var exit = await client.PostAsync($"/access-records/{access.Id}/exit", null, Ct);
            Assert.Equal(HttpStatusCode.OK, exit.StatusCode);
            Assert.Equal("Pendente", (await exit.Content.ReadFromJsonAsync<VehicleAccessRecord>(Ct))!.PaperReviewStatus);
        }
    }
    [Fact]
    public async Task ChangedReplayOrDuplicateLineIsExplicitConflict()
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.TransportationDepartment);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Doorman);
        var request = Request(incident.IncidentId, true);
        await ImportAsync(client, request);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/paper-reconciliation/imports",
            request with { Justification = "Uma justificativa diferente da primeira." }, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/paper-reconciliation/imports",
            request with { RequestKey = Guid.NewGuid() }, Ct)).StatusCode);
        using var other = factory.CreateClient();
        await LoginAsync(other, ProfileNames.SecurityGuard);
        Assert.Equal(HttpStatusCode.Conflict, (await other.PostAsJsonAsync("/paper-reconciliation/imports",
            request with { RequestKey = Guid.NewGuid() }, Ct)).StatusCode);
    }
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task IndependentReviewIsTerminalAndPreservesOperationalExit(bool accept)
    {
        using var manager = factory.CreateClient();
        var reviewer = await LoginAsync(manager, ProfileNames.TransportationDepartment);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        var importer = await LoginAsync(client, ProfileNames.Doorman);
        var receipt = await ImportAsync(client, Request(incident.IncidentId, false));
        using (var scope = factory.Services.CreateScope())
        {
            var store = scope.ServiceProvider.GetRequiredService<IPaperReconciliationStore>();
            Assert.Equal(PaperReconciliationStatus.Forbidden,
                (await store.TryReviewAsync(receipt.AccessRecordId, accept, Reason, importer, DateTime.UtcNow, Ct)).Status);
        }
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync($"/paper-reconciliation/imports/{receipt.AccessRecordId}/review", new { accept, reason = Reason }, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync($"/access-records/{receipt.AccessRecordId}/exit", null, Ct)).StatusCode);
        var uri = $"/paper-reconciliation/imports/{receipt.AccessRecordId}/review";
        Assert.Equal(HttpStatusCode.OK, (await manager.PostAsJsonAsync(uri, new { accept, reason = Reason }, Ct)).StatusCode);
        using var readScope = factory.Services.CreateScope();
        var db = readScope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var first = await db.ReconciliacoesContingencia.AsNoTracking().SingleAsync(x => x.RegistroAcessoId == receipt.AccessRecordId, Ct);
        Assert.Equal(reviewer, first.ConferidoPorId);
        Assert.Equal(accept ? StatusConferenciaContingencia.Conferida : StatusConferenciaContingencia.Recusada, first.Status);
        Assert.Equal(HttpStatusCode.OK, (await manager.PostAsJsonAsync(uri, new { accept, reason = Reason }, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await manager.PostAsJsonAsync(uri, new { accept = !accept, reason = Reason }, Ct)).StatusCode);
        var after = await db.ReconciliacoesContingencia.AsNoTracking().SingleAsync(x => x.RegistroAcessoId == receipt.AccessRecordId, Ct);
        Assert.Equal(first.ConferidoEmUtc, after.ConferidoEmUtc);
        Assert.Equal(1, await db.Auditorias.CountAsync(x => x.Entidade == nameof(ReconciliacaoContingencia) && x.RegistroId == receipt.AccessRecordId && x.Detalhes == "paper_reviewed", Ct));
        Assert.Equal(StatusRegistroAcesso.Encerrado, (await db.RegistrosAcesso.SingleAsync(x => x.Id == receipt.AccessRecordId, Ct)).Status);
    }
    [Fact]
    public async Task ClosedPaperEntryCanPrecedeCurrentOpenEntryButCannotOverlapIt()
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Doorman);
        var request = Request(incident.IncidentId, true);
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/access-records/entries", request.Entry, Ct)).StatusCode);
        await ImportAsync(client, request);
        var conflict = await client.PostAsJsonAsync("/paper-reconciliation/imports", request with { RequestKey = Guid.NewGuid(), LineNumber = 2 }, Ct);
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
        Assert.Contains("paper_access_overlap", await conflict.Content.ReadAsStringAsync(Ct));
    }
    [Fact]
    public async Task QueueIsPaginatedAndOperatorScoped()
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var first = factory.CreateClient();
        var firstId = await LoginAsync(first, ProfileNames.Doorman);
        var receipt = await ImportAsync(first, Request(incident.IncidentId, true));
        using var other = factory.CreateClient();
        var otherId = await LoginAsync(other, ProfileNames.SecurityGuard);
        var own = await first.GetFromJsonAsync<PaperReconciliationPage>("/paper-reconciliation/imports?status=Pendente&pageSize=1", Ct);
        Assert.All(own!.Items, x => Assert.Equal(firstId, x.ImportedById));
        var hidden = await other.GetFromJsonAsync<PaperReconciliationPage>("/paper-reconciliation/imports", Ct);
        Assert.Empty(hidden!.Items);
        var all = await manager.GetFromJsonAsync<PaperReconciliationPage>("/paper-reconciliation/imports?pageSize=100", Ct);
        Assert.Contains(all!.Items, x => x.AccessRecordId == receipt.AccessRecordId);
        foreach (var suffix in new[] { "?page=0", "?page=2147483647", "?pageSize=101", "?status=Invalid" })
            Assert.Equal(HttpStatusCode.BadRequest, (await manager.GetAsync("/paper-reconciliation/imports" + suffix, Ct)).StatusCode);
        Assert.NotEqual(firstId, otherId);
    }
    [Fact]
    public async Task ConcurrentExactImportsCreateOneAccessAndOneAudit()
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Doorman);
        var request = Request(incident.IncidentId, true);
        var receipts = await Task.WhenAll(Enumerable.Range(0, 3).Select(_ => ImportAsync(client, request)));
        Assert.All(receipts, r => Assert.Equal(receipts[0], r));
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.Equal(1, await db.ReconciliacoesContingencia.CountAsync(x => x.IncidenteId == incident.IncidentId, Ct));
    }
    [Fact]
    public async Task ConcurrentDifferentIntentionsForOneLineHaveOneWinner()
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Doorman);
        var request = Request(incident.IncidentId, true);
        var responses = await Task.WhenAll(client.PostAsJsonAsync("/paper-reconciliation/imports", request, Ct),
            client.PostAsJsonAsync("/paper-reconciliation/imports", request with { RequestKey = Guid.NewGuid() }, Ct));
        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.Conflict);
    }
    [Fact]
    public async Task IncidentIntentIsIdempotentAndCannotChangePeriod()
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var now = DateTimeOffset.UtcNow;
        var command = new PaperIncidentRequest(Guid.NewGuid(), "Folha fictícia " + Guid.NewGuid().ToString("N"),
            now.AddHours(-3).ToString("O"), now.AddHours(-1).ToString("O"));
        var a = await manager.PostAsJsonAsync("/paper-reconciliation/incidents", command, Ct);
        var b = await manager.PostAsJsonAsync("/paper-reconciliation/incidents", command, Ct);
        Assert.Equal(HttpStatusCode.OK, a.StatusCode);
        Assert.Equal(HttpStatusCode.OK, b.StatusCode);
        Assert.Equal(await a.Content.ReadFromJsonAsync<PaperIncidentRecord>(Ct), await b.Content.ReadFromJsonAsync<PaperIncidentRecord>(Ct));
        Assert.Equal(HttpStatusCode.Conflict, (await manager.PostAsJsonAsync("/paper-reconciliation/incidents", command with { PaperReference = "Outra folha fictícia" }, Ct)).StatusCode);
    }
    [Fact]
    public async Task InvalidTimesAndMissingIncidentsCannotProduceAccess()
    {
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Doorman);
        var request = Request(Guid.NewGuid(), true);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync("/paper-reconciliation/imports", request, Ct)).StatusCode);
        foreach (var time in new[] { "2026-01-01T10:00:00", "14/11/2026 10:00:00-03:00", "", "invalid" })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/paper-reconciliation/imports", request with { ObservedEntryAt = time }, Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/paper-reconciliation/imports", request with { PaperAuthorReference = "Bad\0Author" }, Ct)).StatusCode);
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/paper-reconciliation/imports", request with { IncidentId = incident.IncidentId, ObservedEntryAt = DateTimeOffset.UtcNow.AddDays(-3).ToString("O") }, Ct)).StatusCode);
    }
    [Fact]
    public async Task AnonymousAndOperatorsCannotRegisterIncidents()
    {
        using var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/paper-reconciliation/incidents", Ct)).StatusCode);
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Doorman);
        var command = new PaperIncidentRequest(Guid.NewGuid(), "Folha fictícia", DateTimeOffset.UtcNow.AddHours(-3).ToString("O"), DateTimeOffset.UtcNow.AddHours(-1).ToString("O"));
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/paper-reconciliation/incidents", command, Ct)).StatusCode);
    }
    [Fact]
    public async Task FailedPaperAuditRollsBackAccessProvenanceAndNewPerson()
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        var actor = await LoginAsync(client, ProfileNames.Doorman);
        var request = Request(incident.IncidentId, true);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var options = new DbContextOptionsBuilder<ControleAcessoVeiculosDbContext>()
            .UseNpgsql(db.Database.GetConnectionString()).AddInterceptors(new RejectPaperAudit()).Options;
        await using (var failing = new ControleAcessoVeiculosDbContext(options))
        {
            var zone = scope.ServiceProvider.GetRequiredService<TimeZoneInfo>();
            var store = new PaperReconciliationStore(failing, new VehicleAccessStore(failing, zone));
            var service = new PaperReconciliationService(store, TimeProvider.System);
            var command = new ImportPaperAccessCommand(request.RequestKey, request.IncidentId, request.LineNumber,
                request.PaperAuthorReference, DateTimeOffset.Parse(request.ObservedEntryAt),
                DateTimeOffset.Parse(request.ObservedExitAt!), request.Justification, request.Entry);
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.ImportAsync(command, actor, ProfileNames.Doorman, Ct));
        }
        Assert.False(await db.Pessoas.AnyAsync(x => x.Nome == request.Entry.DriverName, Ct));
        Assert.False(await db.Veiculos.AnyAsync(x => x.Placa == request.Entry.Plate, Ct));
        Assert.False(await db.ReconciliacoesContingencia.AnyAsync(x => x.IncidenteId == incident.IncidentId, Ct));
    }
    [Fact]
    public async Task OrdinaryEntryKeepsServerTimeAndAuthenticatedAuthor()
    {
        using var client = factory.CreateClient();
        var actor = await LoginAsync(client, ProfileNames.Doorman);
        var source = Request(Guid.NewGuid(), false).Entry;
        var before = DateTime.UtcNow.AddSeconds(-1);
        var response = await client.PostAsJsonAsync("/access-records/entries", new
        {
            source.DriverName,
            source.Plate,
            source.Objective,
            source.CategoryName,
            entryAtUtc = DateTime.UtcNow.AddDays(-10),
            observedEntryAt = DateTime.UtcNow.AddDays(-10),
            createdById = 999999
        }, Ct);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var record = (await response.Content.ReadFromJsonAsync<VehicleAccessRecord>(Ct))!;
        Assert.True(record.EntryAtUtc >= before);
        Assert.Equal(actor, record.CreatedById);
        Assert.Null(record.PaperReviewStatus);
    }

    [Fact]
    public async Task PostgreSqlConstraintRejectsSelfApprovalOutsideTheDomain()
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        var actor = await LoginAsync(client, ProfileNames.Doorman);
        var receipt = await ImportAsync(client, Request(incident.IncidentId, true));
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var error = await Assert.ThrowsAsync<Npgsql.PostgresException>(() => db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE dbo.reconciliacoes_contingencia SET status = 'Conferida', conferido_por_id = {actor}, conferido_em_utc = {DateTime.UtcNow}, motivo_conferencia = {Reason} WHERE registro_acesso_id = {receipt.AccessRecordId}", Ct));
        Assert.Equal(Npgsql.PostgresErrorCodes.CheckViolation, error.SqlState);
        Assert.Equal(StatusConferenciaContingencia.Pendente, (await db.ReconciliacoesContingencia.SingleAsync(x => x.RegistroAcessoId == receipt.AccessRecordId, Ct)).Status);
    }

    [Fact]
    public async Task EventQuotaUsesObservedTimeAndExactReplayDoesNotConsumeAgain()
    {
        using var manager = factory.CreateClient();
        var owner = await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Doorman);
        var request = Request(incident.IncidentId, true);
        int eventId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
            var entry = DateTimeOffset.Parse(request.ObservedEntryAt).UtcDateTime;
            var authorization = new EventoAcesso("Evento fictício de papel", "Responsável fictício", null,
                entry.AddMinutes(-5), entry.AddMinutes(5), "Área fictícia", false,
                LocalEstacionamentoEvento.Interno, null, owner, DateTime.UtcNow);
            db.EventosAcesso.Add(authorization);
            await db.SaveChangesAsync(Ct);
            db.AutorizacoesVeiculosEventos.Add(new AutorizacaoVeiculoEvento(authorization.Id, "AUTOMÓVEL", 1));
            await db.SaveChangesAsync(Ct);
            eventId = authorization.Id;
        }
        request = request with { Entry = request.Entry with { EventAuthorizationId = eventId } };
        var first = await ImportAsync(client, request);
        Assert.Equal(first, await ImportAsync(client, request));
        var another = request with
        {
            RequestKey = Guid.NewGuid(),
            LineNumber = 2,
            Entry = request.Entry with { Plate = TestPlate.From(Guid.NewGuid().ToString("N")) }
        };
        var response = await client.PostAsJsonAsync("/paper-reconciliation/imports", another, Ct);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Contains("EventQuotaExceeded", await response.Content.ReadAsStringAsync(Ct));
    }
    [Theory]
    [InlineData(ProfileNames.Administrator)]
    [InlineData(ProfileNames.TransportationDepartment)]
    public async Task ManagerCannotApproveTheirOwnImportedRow(string role)
    {
        using var client = factory.CreateClient();
        await LoginAsync(client, role);
        var incident = await IncidentAsync(client);
        var receipt = await ImportAsync(client, Request(incident.IncidentId, true));
        var response = await client.PostAsJsonAsync($"/paper-reconciliation/imports/{receipt.AccessRecordId}/review",
            new { accept = true, reason = Reason }, Ct);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ConcurrentOppositeReviewsPreserveOneDecision()
    {
        using var manager = factory.CreateClient();
        await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Doorman);
        var receipt = await ImportAsync(client, Request(incident.IncidentId, true));
        var uri = $"/paper-reconciliation/imports/{receipt.AccessRecordId}/review";
        var responses = await Task.WhenAll(manager.PostAsJsonAsync(uri, new { accept = true, reason = Reason }, Ct),
            manager.PostAsJsonAsync(uri, new { accept = false, reason = Reason }, Ct));
        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.Conflict);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        Assert.Equal(1, await db.Auditorias.CountAsync(x => x.Entidade == nameof(ReconciliacaoContingencia) && x.RegistroId == receipt.AccessRecordId && x.Detalhes == "paper_reviewed", Ct));
    }
    [Fact]
    public async Task FailedReviewAuditPreservesPendingState()
    {
        using var manager = factory.CreateClient();
        var reviewer = await LoginAsync(manager, ProfileNames.Administrator);
        var incident = await IncidentAsync(manager);
        using var client = factory.CreateClient();
        await LoginAsync(client, ProfileNames.Doorman);
        var receipt = await ImportAsync(client, Request(incident.IncidentId, true));
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var options = new DbContextOptionsBuilder<ControleAcessoVeiculosDbContext>()
            .UseNpgsql(db.Database.GetConnectionString()).AddInterceptors(new RejectPaperAudit("paper_reviewed")).Options;
        await using (var failing = new ControleAcessoVeiculosDbContext(options))
        {
            var zone = scope.ServiceProvider.GetRequiredService<TimeZoneInfo>();
            var store = new PaperReconciliationStore(failing, new VehicleAccessStore(failing, zone));
            await Assert.ThrowsAsync<InvalidOperationException>(() => store.TryReviewAsync(
                receipt.AccessRecordId, true, Reason, reviewer, DateTime.UtcNow, Ct));
        }
        Assert.Equal(StatusConferenciaContingencia.Pendente, (await db.ReconciliacoesContingencia.SingleAsync(x => x.RegistroAcessoId == receipt.AccessRecordId, Ct)).Status);
    }
    private sealed class RejectPaperAudit(string operation = "paper_imported") : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData data,
            InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (data.Context!.ChangeTracker.Entries<Auditoria>().Any(x =>
                x.State == EntityState.Added && x.Entity.Detalhes == operation))
                throw new InvalidOperationException("Controlled paper audit failure.");
            return ValueTask.FromResult(result);
        }
    }
    private async Task<PaperIncidentRecord> IncidentAsync(HttpClient manager)
    {
        var now = DateTimeOffset.UtcNow;
        var response = await manager.PostAsJsonAsync("/paper-reconciliation/incidents", new PaperIncidentRequest(
            Guid.NewGuid(), "Folha fictícia " + Guid.NewGuid().ToString("N"),
            now.AddHours(-3).ToString("O"), now.AddHours(-1).ToString("O")), Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<PaperIncidentRecord>(Ct))!;
    }
    private static PaperImportRequest Request(Guid incident, bool closed)
    {
        var now = DateTimeOffset.UtcNow;
        return new(Guid.NewGuid(), incident, 1, "Autor da folha fictícia", now.AddHours(-2).ToString("O"),
            closed ? now.AddMinutes(-90).ToString("O") : null, "Transcrição da folha fictícia após indisponibilidade.",
            new RegisterVehicleEntryCommand("Condutor fictício " + Guid.NewGuid().ToString("N"),
                TestPlate.From(Guid.NewGuid().ToString("N")), "Visita fictícia", "Visitante", VehicleType: "Automóvel"));
    }
    private static async Task<PaperReconciliationReceipt> ImportAsync(HttpClient client, PaperImportRequest request)
    {
        var response = await client.PostAsJsonAsync("/paper-reconciliation/imports", request, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("no-store", response.Headers.CacheControl!.ToString());
        return (await response.Content.ReadFromJsonAsync<PaperReconciliationReceipt>(Ct))!;
    }
    private async Task<int> LoginAsync(HttpClient client, string role)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var hash = scope.ServiceProvider.GetRequiredService<IPasswordHashService>();
        var profile = await db.Perfis.SingleOrDefaultAsync(x => x.Nome == role, Ct);
        if (profile is null)
        {
            profile = new Perfil(role);
            db.Perfis.Add(profile);
        }
        var person = new Pessoa("Operador fictício " + Guid.NewGuid().ToString("N"));
        db.Pessoas.Add(person);
        await db.SaveChangesAsync(Ct);
        var email = Guid.NewGuid().ToString("N") + "@example.test";
        var user = new Usuario(email, hash.Hash(Password), person.Id, profile.Id);
        db.Usuarios.Add(user);
        await db.SaveChangesAsync(Ct);
        var response = await client.PostAsJsonAsync("/auth/login", new { email, password = Password }, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var token = (await response.Content.ReadFromJsonAsync<TokenResponse>(Ct))!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
        return user.Id;
    }
    private sealed record TokenResponse(string AccessToken);
}
