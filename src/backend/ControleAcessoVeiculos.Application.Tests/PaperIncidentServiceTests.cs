using ControleAcessoVeiculos.Application.Contingency;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class PaperIncidentServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 28, 14, 0, 0, TimeSpan.Zero);
    private static readonly RegisterPaperIncidentCommand Command = new(
        Guid.Parse("c8f4c276-6be5-4a8b-9507-3495bc185122"), "QA sheet 1",
        Now.AddHours(-2), Now.AddHours(-1));

    [Theory]
    [InlineData("missing-key", "incidentId")]
    [InlineData("blank-reference", "paperReference")]
    [InlineData("short-reference", "paperReference")]
    [InlineData("long-reference", "paperReference")]
    [InlineData("control-character", "paperReference")]
    [InlineData("missing-start", "period")]
    [InlineData("missing-end", "period")]
    [InlineData("inverted-period", "period")]
    [InlineData("future-end", "period")]
    public async Task RegisterRejectsInvalidInputBeforeCallingTheCatalog(string scenario, string expectedField)
    {
        var catalog = new FakeCatalog(false);
        var service = new PaperIncidentService(catalog, new FixedClock());
        var command = scenario switch
        {
            "missing-key" => Command with { IncidentId = Guid.Empty },
            "blank-reference" => Command with { PaperReference = " " },
            "short-reference" => Command with { PaperReference = "ab" },
            "long-reference" => Command with { PaperReference = new string('x', 121) },
            "control-character" => Command with { PaperReference = "QA\tsheet" },
            "missing-start" => Command with { StartedAt = default },
            "missing-end" => Command with { EndedAt = default },
            "inverted-period" => Command with { StartedAt = Command.EndedAt.AddMinutes(1) },
            "future-end" => Command with { EndedAt = Now.AddMinutes(1) },
            _ => throw new ArgumentOutOfRangeException(nameof(scenario))
        };

        var result = await service.RegisterAsync(command, 42, TestContext.Current.CancellationToken);

        Assert.Equal(PaperReconciliationStatus.Invalid, result.Status);
        Assert.NotNull(result.Errors);
        Assert.Contains(expectedField, result.Errors.Keys);
        Assert.Equal(0, catalog.Calls);
    }

    [Theory]
    [InlineData(false, PaperReconciliationStatus.Success)]
    [InlineData(true, PaperReconciliationStatus.Conflict)]
    public async Task RegisterPreservesActorAndMapsTheCatalogOutcome(bool conflict,
        PaperReconciliationStatus expectedStatus)
    {
        var catalog = new FakeCatalog(conflict);
        var service = new PaperIncidentService(catalog, new FixedClock());

        var result = await service.RegisterAsync(Command, 42, TestContext.Current.CancellationToken);

        Assert.Equal(expectedStatus, result.Status);
        Assert.Equal(1, catalog.Calls);
        if (conflict)
        {
            Assert.Null(result.Incident);
        }
        else
        {
            Assert.NotNull(result.Incident);
            Assert.Equal(Command.IncidentId, result.Incident.IncidentId);
            Assert.Equal(42, result.Incident.CreatedById);
            Assert.Equal(Now.UtcDateTime, result.Incident.CreatedAtUtc);
        }
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class FakeCatalog(bool conflict) : IPaperReconciliationCatalog
    {
        public int Calls { get; private set; }

        public Task<PaperIncidentRecord?> RegisterIncidentAsync(RegisterPaperIncidentCommand command,
            int actorUserId, DateTime createdAtUtc, CancellationToken ct)
        {
            Calls++;
            PaperIncidentRecord? result = conflict ? null : new(command.IncidentId, command.PaperReference,
                command.StartedAt.UtcDateTime, command.EndedAt.UtcDateTime, actorUserId, createdAtUtc);
            return Task.FromResult(result);
        }

        public Task<IReadOnlyList<PaperIncidentRecord>> ListIncidentsAsync(int page, int pageSize,
            CancellationToken ct) => throw new NotSupportedException();

        public Task<PaperReconciliationPage> SearchAsync(string? status, int? importedById, int page,
            int pageSize, CancellationToken ct) => throw new NotSupportedException();
    }
}
