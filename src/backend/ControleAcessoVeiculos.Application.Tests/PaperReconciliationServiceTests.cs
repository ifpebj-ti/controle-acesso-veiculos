using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Application.Contingency;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class PaperReconciliationServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 4, 14, 0, 0, TimeSpan.Zero);
    private readonly FakeStore store = new();

    private PaperReconciliationService Service => new(store, new FixedClock());
    private static ImportPaperAccessCommand Valid => new(
        Guid.Parse("11111111-1111-4111-8111-111111111111"),
        Guid.Parse("22222222-2222-4222-8222-222222222222"),
        7, " Operador da folha 1 ", Now.AddHours(-2), null,
        " Registro transcrito após indisponibilidade. ",
        new RegisterVehicleEntryCommand(" Condutor Fictício ", " abc-1234 ",
            " Entrega de material ", "Visitante", Observation: " Papel preservado "));

    [Theory]
    [InlineData(ProfileNames.Doorman)]
    [InlineData(ProfileNames.SecurityGuard)]
    public async Task ImportsAsOperationAndPreservesIndependentTimes(string profile)
    {
        var command = Valid with { ObservedEntryAt = Now.AddHours(-2).ToOffset(TimeSpan.FromHours(-3)) };
        var result = await Service.ImportAsync(command, 10, profile, TestContext.Current.CancellationToken);
        Assert.Equal(PaperReconciliationStatus.Success, result.Status);
        Assert.Equal(1, store.ImportCalls);
        Assert.Equal(10, store.ActorId);
        Assert.Equal(Now.UtcDateTime, store.ServerTime);
        var data = Assert.IsType<PaperImportData>(store.Imported);
        Assert.Equal(command.RequestKey, data.RequestKey);
        Assert.Equal(command.IncidentId, data.IncidentId);
        Assert.Equal(7, data.LineNumber);
        Assert.Equal(Now.AddHours(-2).UtcDateTime, data.ObservedEntryAtUtc);
        Assert.Equal(DateTimeKind.Utc, data.ObservedEntryAtUtc.Kind);
        Assert.Null(data.ObservedExitAtUtc);
        Assert.Equal("Operador da folha 1", data.PaperAuthorReference);
        Assert.Equal("ABC1234", data.Entry.Plate);
        Assert.Equal("Condutor Fictício", data.Entry.DriverName);
        Assert.Equal("Visitante", data.Entry.CategoryName);
        Assert.Equal("Papel preservado", data.Entry.Observation);
    }

    [Fact]
    public async Task CompletedPaperEntryPassesObservedExitWithoutReplacingItWithImportTime()
    {
        await Service.ImportAsync(Valid with { ObservedExitAt = Now.AddHours(-1) },
            10, ProfileNames.Doorman, TestContext.Current.CancellationToken);
        Assert.Equal(Now.AddHours(-1).UtcDateTime, store.Imported!.ObservedExitAtUtc);
        Assert.Equal(Now.UtcDateTime, store.ServerTime);
    }

    [Theory]
    [InlineData(ProfileNames.Administrator)]
    [InlineData(ProfileNames.TransportationDepartment)]
    [InlineData("Porteiro ")]
    [InlineData("unknown")]
    [InlineData("")]
    public async Task OtherProfilesCannotImport(string profile)
    {
        var result = await Service.ImportAsync(Valid, 10, profile, TestContext.Current.CancellationToken);
        Assert.Equal(PaperReconciliationStatus.Forbidden, result.Status);
        Assert.Equal(0, store.ImportCalls);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task InvalidActorCannotReachPersistence(int actor)
    {
        var result = await Service.ImportAsync(Valid, actor, ProfileNames.Doorman, TestContext.Current.CancellationToken);
        Assert.Equal(PaperReconciliationStatus.Forbidden, result.Status);
        var review = await Service.ReviewAsync(1, new(true, "Conferência da folha."), actor,
            ProfileNames.Administrator, TestContext.Current.CancellationToken);
        Assert.Equal(PaperReconciliationStatus.Forbidden, review.Status);
        Assert.Equal(0, store.ImportCalls + store.ReviewCalls);
    }

    [Theory]
    [InlineData("requestKey")]
    [InlineData("incidentId")]
    [InlineData("lineNumber")]
    [InlineData("paperAuthorReference")]
    [InlineData("justification")]
    [InlineData("entry")]
    [InlineData("plate")]
    [InlineData("categoryName")]
    [InlineData("document")]
    [InlineData("candidate")]
    [InlineData("year")]
    [InlineData("observation")]
    public async Task InvalidInputNeverReachesStore(string field)
    {
        var command = field switch
        {
            "requestKey" => Valid with { RequestKey = Guid.Empty },
            "incidentId" => Valid with { IncidentId = Guid.Empty },
            "lineNumber" => Valid with { LineNumber = 0 },
            "paperAuthorReference" => Valid with { PaperAuthorReference = new string('x', 121) },
            "justification" => Valid with { Justification = "curta" },
            "entry" => Valid with { Entry = null! },
            "plate" => Valid with { Entry = Valid.Entry with { Plate = "777777" } },
            "categoryName" => Valid with { Entry = Valid.Entry with { CategoryName = "inexistente" } },
            "document" => Valid with { Entry = Valid.Entry with { DocumentType = "CPF" } },
            "candidate" => Valid with { Entry = Valid.Entry with { VehicleId = 1 } },
            "year" => Valid with { Entry = Valid.Entry with { Year = 2028 } },
            _ => Valid with { Entry = Valid.Entry with { Observation = new string('x', 1001) } }
        };
        var result = await Service.ImportAsync(command, 10, ProfileNames.Doorman, TestContext.Current.CancellationToken);
        Assert.Equal(PaperReconciliationStatus.Invalid, result.Status);
        Assert.True(result.Errors!.ContainsKey(field));
        Assert.Equal(0, store.ImportCalls);
    }

    [Theory]
    [InlineData("missing-entry")]
    [InlineData("future-entry")]
    [InlineData("missing-exit")]
    [InlineData("exit-before-entry")]
    [InlineData("future-exit")]
    public async Task DoesNotInventMissingOrContradictoryTimes(string scenario)
    {
        var command = scenario switch
        {
            "missing-entry" => Valid with { ObservedEntryAt = default },
            "future-entry" => Valid with { ObservedEntryAt = Now.AddSeconds(1) },
            "missing-exit" => Valid with { ObservedExitAt = default(DateTimeOffset) },
            "exit-before-entry" => Valid with { ObservedExitAt = Now.AddHours(-3) },
            _ => Valid with { ObservedExitAt = Now.AddSeconds(1) }
        };
        var result = await Service.ImportAsync(command, 10, ProfileNames.Doorman, TestContext.Current.CancellationToken);
        Assert.Equal(PaperReconciliationStatus.Invalid, result.Status);
        Assert.Equal(0, store.ImportCalls);
    }

    [Theory]
    [InlineData(ProfileNames.TransportationDepartment, true)]
    [InlineData(ProfileNames.Administrator, false)]
    public async Task ReviewUsesServerActorTimeAndPreservesDecision(string profile, bool accept)
    {
        var result = await Service.ReviewAsync(42, new(accept, " Conferido contra a folha. "), 20,
            profile, TestContext.Current.CancellationToken);
        Assert.Equal(PaperReconciliationStatus.Success, result.Status);
        Assert.Equal(1, store.ReviewCalls);
        Assert.Equal(42, store.ReviewAccessId);
        Assert.Equal(accept, store.Accept);
        Assert.Equal("Conferido contra a folha.", store.Reason);
        Assert.Equal(20, store.ActorId);
        Assert.Equal(Now.UtcDateTime, store.ServerTime);
    }

    [Theory]
    [InlineData(ProfileNames.Doorman)]
    [InlineData(ProfileNames.SecurityGuard)]
    [InlineData("unknown")]
    public async Task OperationCannotReview(string profile)
    {
        var result = await Service.ReviewAsync(42, new(true, "Conferido na folha."), 20,
            profile, TestContext.Current.CancellationToken);
        Assert.Equal(PaperReconciliationStatus.Forbidden, result.Status);
        Assert.Equal(0, store.ReviewCalls);
    }

    [Theory]
    [InlineData(0, "Conferido na folha.")]
    [InlineData(42, "curta")]
    public async Task InvalidReviewDoesNotReachStore(int id, string reason)
    {
        var result = await Service.ReviewAsync(id, new(true, reason), 20,
            ProfileNames.Administrator, TestContext.Current.CancellationToken);
        Assert.Equal(PaperReconciliationStatus.Invalid, result.Status);
        Assert.Equal(0, store.ReviewCalls);
    }

    [Theory]
    [InlineData(PaperReconciliationStatus.Conflict)]
    [InlineData(PaperReconciliationStatus.NotFound)]
    [InlineData(PaperReconciliationStatus.Forbidden)]
    public async Task ReturnsCanonicalStoreOutcomeWithoutRetry(PaperReconciliationStatus status)
    {
        store.Result = new(status, Code: "controlled_conflict");
        var result = await Service.ImportAsync(Valid, 10, ProfileNames.Doorman, TestContext.Current.CancellationToken);
        Assert.Same(store.Result, result);
        Assert.Equal(1, store.ImportCalls);
        var review = await Service.ReviewAsync(42, new(true, "Conferido na folha."), 20,
            ProfileNames.Administrator, TestContext.Current.CancellationToken);
        Assert.Same(store.Result, review);
        Assert.Equal(1, store.ReviewCalls);
    }

    [Fact]
    public async Task ReplayedReceiptRetainsFirstImportTimestamp()
    {
        var original = new PaperReconciliationReceipt(42, "Pendente", Now.AddHours(-1).UtcDateTime);
        store.Result = new(PaperReconciliationStatus.Success, original);
        var result = await Service.ImportAsync(Valid, 10, ProfileNames.Doorman, TestContext.Current.CancellationToken);
        Assert.Same(original, result.Receipt);
    }

    [Fact]
    public async Task CancelledRequestNeverStartsPersistence()
    {
        using var source = new CancellationTokenSource();
        source.Cancel();
        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            Service.ImportAsync(Valid, 10, ProfileNames.Doorman, source.Token));
        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            Service.ReviewAsync(42, new(true, "Conferido na folha."), 20, ProfileNames.Administrator, source.Token));
        Assert.Equal(0, store.ImportCalls + store.ReviewCalls);
    }

    [Fact]
    public async Task UncertainStoreExceptionDoesNotTriggerSecondWrite()
    {
        store.Fail = true;
        await Assert.ThrowsAsync<IOException>(() => Service.ImportAsync(Valid, 10,
            ProfileNames.Doorman, TestContext.Current.CancellationToken));
        Assert.Equal(1, store.ImportCalls);
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class FakeStore : IPaperReconciliationStore
    {
        public int ImportCalls { get; private set; }
        public int ReviewCalls { get; private set; }
        public int ActorId { get; private set; }
        public DateTime ServerTime { get; private set; }
        public PaperImportData? Imported { get; private set; }
        public int ReviewAccessId { get; private set; }
        public bool Accept { get; private set; }
        public string? Reason { get; private set; }
        public bool Fail { get; set; }
        public PaperReconciliationResult Result { get; set; } = new(PaperReconciliationStatus.Success);

        public Task<PaperReconciliationResult> TryImportAsync(PaperImportData data, int actorUserId,
            DateTime importedAtUtc, CancellationToken cancellationToken)
        {
            ImportCalls++;
            Imported = data;
            ActorId = actorUserId;
            ServerTime = importedAtUtc;
            if (Fail) throw new IOException("controlled lost response");
            return Task.FromResult(Result);
        }

        public Task<PaperReconciliationResult> TryReviewAsync(int accessRecordId, bool accept,
            string reason, int reviewerUserId, DateTime reviewedAtUtc, CancellationToken cancellationToken)
        {
            ReviewCalls++;
            ReviewAccessId = accessRecordId;
            Accept = accept;
            Reason = reason;
            ActorId = reviewerUserId;
            ServerTime = reviewedAtUtc;
            return Task.FromResult(Result);
        }
    }
}
