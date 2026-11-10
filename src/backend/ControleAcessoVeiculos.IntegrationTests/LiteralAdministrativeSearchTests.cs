using ControleAcessoVeiculos.Application.AdministrativeReports;
using ControleAcessoVeiculos.Application.Auditing;
using ControleAcessoVeiculos.Application.EventAuthorizations;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.AdministrativeReports;
using ControleAcessoVeiculos.Infrastructure.Auditing;
using ControleAcessoVeiculos.Infrastructure.Data;
using ControleAcessoVeiculos.Infrastructure.EventAuthorizations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class LiteralAdministrativeSearchTests(ApiFactory factory)
{
    [Theory]
    [InlineData("%")]
    [InlineData("_")]
    [InlineData("\\")]
    public async Task AdministrativeFiltersTreatPatternCharactersAsLiteralText(string character)
    {
        var ct = TestContext.Current.CancellationToken;
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var day = new DateTime(2081, 3, 12, 12, 0, 0, DateTimeKind.Utc);
        var suffix = Guid.NewGuid().ToString("N");
        var profile = new Perfil($"Literal-{suffix}", "Test-only profile");
        var actor = new Pessoa($"QA actor {suffix}");
        db.AddRange(profile, actor);
        await db.SaveChangesAsync(ct);
        var user = new Usuario($"literal-{suffix}@example.test", "test-only-hash", actor.Id, profile.Id);
        db.Add(user);
        await db.SaveChangesAsync(ct);

        for (var index = 0; index < 2; index++)
        {
            var marker = index == 0 ? character : "ordinary";
            var person = new Pessoa($"QA {marker} driver");
            var vehicle = new Veiculo(TestPlate.From(Guid.NewGuid().ToString("N")), "Automóvel", $"QA{marker}{index}", true);
            var category = new CategoriaAcesso($"QA {marker} category {suffix}");
            db.AddRange(person, vehicle, category);
            await db.SaveChangesAsync(ct);
            var access = new RegistroAcesso(vehicle.Id, person.Id, category.Id, day, "QA literal search", user.Id);
            access.RegistrarSaida(day.AddHours(1), user.Id);
            var usage = new UsoVeiculoInstitucional(vehicle.Id, person.Id, day, 10, "QA itinerary", user.Id);
            usage.RegistrarRetorno(day.AddHours(1), 20, user.Id);
            db.AddRange(access, usage,
                new Auditoria(day, TipoAcaoAuditoria.Consulta, $"QA{marker}", index + 1, user.Id),
                new EventoAcesso($"QA {marker} event", "QA responsible", null, day, day.AddHours(1),
                    "QA area", false, LocalEstacionamentoEvento.Interno, null, user.Id, day));
        }

        await db.SaveChangesAsync(ct);
        var criteria = new AdministrativeReportCriteria(
            DateOnly.FromDateTime(day), DateOnly.FromDateTime(day), day.Date, day.Date.AddDays(1),
            null, null, null, null, null, 1, 25);
        var reports = new AdministrativeReportStore(db);
        Assert.Equal(2, (await reports.SearchVehicleMovementsAsync(criteria, "America/Recife", ct)).TotalCount);
        Assert.Equal(2, (await reports.SearchInstitutionalFleetAsync(criteria, "America/Recife", ct)).TotalCount);
        Assert.Equal(0, (await reports.SearchVehicleMovementsAsync(criteria with { Plate = character }, "America/Recife", ct)).TotalCount);
        Assert.Equal(0, (await reports.SearchInstitutionalFleetAsync(criteria with { Plate = character }, "America/Recife", ct)).TotalCount);
        Assert.Equal(1, (await reports.SearchVehicleMovementsAsync(criteria with { DriverName = character }, "America/Recife", ct)).TotalCount);
        Assert.Equal(1, (await reports.SearchVehicleMovementsAsync(criteria with { CategoryName = character }, "America/Recife", ct)).TotalCount);
        Assert.Equal(1, (await reports.SearchInstitutionalFleetAsync(criteria with { DriverName = character }, "America/Recife", ct)).TotalCount);
        Assert.Equal(1, (await reports.SearchInstitutionalFleetAsync(criteria with { VehicleIdentification = character }, "America/Recife", ct)).TotalCount);
        Assert.Equal(2, (await reports.SearchVehicleMovementsAsync(criteria with { DriverName = "driver" }, "America/Recife", ct)).TotalCount);

        var auditCriteria = new AuditTrailSearchCriteria(day.Date, day.Date.AddDays(1), null,
            $"QA{character}", null, user.Id, null, 1, 25);
        Assert.Equal(1, (await new AuditTrailStore(db).SearchAsync(auditCriteria, ct)).TotalCount);
        Assert.Equal(0, (await new AuditTrailStore(db).SearchAsync(auditCriteria with { Entity = character }, ct)).TotalCount);
        var events = new EventAuthorizationStore(db);
        var eventCriteria = new EventAuthorizationSearchCriteria(day.Date, day.Date.AddDays(1), character, true, 1, 25);
        Assert.Equal(1, (await events.SearchAsync(eventCriteria, ct)).TotalCount);
        Assert.Equal(2, (await events.SearchAsync(eventCriteria with { Name = "QA" }, ct)).TotalCount);
        await transaction.RollbackAsync(ct);
    }
}
