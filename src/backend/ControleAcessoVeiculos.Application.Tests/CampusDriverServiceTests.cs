using ControleAcessoVeiculos.Application.CampusDrivers;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class CampusDriverServiceTests
{
    [Theory]
    [InlineData("2026-11-13T02:59:59Z", "2026-11-12", "2026-11-12T03:00:00Z", "2026-11-13T03:00:00Z")]
    [InlineData("2026-11-13T03:00:00Z", "2026-11-13", "2026-11-13T03:00:00Z", "2026-11-14T03:00:00Z")]
    public void UsesInstitutionalMidnightNotRollingTwentyFourHours(string now, string day, string from, string until)
    {
        var service = Create(new StubStore(), now);
        var window = service.CurrentWindow();
        Assert.Equal(DateOnly.Parse(day), window.Today);
        Assert.Equal(DateTime.Parse(from).ToUniversalTime(), window.FromUtc);
        Assert.Equal(DateTime.Parse(until).ToUniversalTime(), window.ToExclusiveUtc);
    }

    [Theory]
    [InlineData("2008-11-13", true, "birthDate")]
    [InlineData("2008-11-12", false, "birthDateConfirmed")]
    public async Task RejectsUnconfirmedOrUnderageBeforePersistence(string birth, bool confirmed, string field)
    {
        var store = new StubStore();
        var service = Create(store, "2026-11-13T02:00:00Z");
        var result = await service.RegisterAsync(new("Pessoa Fictícia", "Aluno", DateOnly.Parse(birth),
            confirmed, "ABC1D23", "Automóvel"), 42, TestContext.Current.CancellationToken);
        Assert.Equal(CampusDriverStatus.Invalid, result.Status);
        Assert.Contains(field, result.Errors.Keys);
        Assert.False(store.Called);
    }

    private static CampusDriverService Create(StubStore store, string now) =>
        new(store, new FrozenClock(DateTimeOffset.Parse(now)), TimeZoneInfo.FindSystemTimeZoneById("America/Recife"));
    private sealed class FrozenClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
    private sealed class StubStore : ICampusDriverStore
    {
        public bool Called { get; private set; }
        public Task<CampusDriverResult> RegisterAsync(RegisterCampusDriverCommand command, int actorId, DateTime nowUtc, DateOnly today, CancellationToken ct)
        {
            Called = true;
            throw new InvalidOperationException("Validation should prevent persistence in these cases.");
        }
        public Task<CampusDriverResult> AddVehicleAsync(int personId, AddCampusDriverVehicleCommand command, int actorId, DateTime nowUtc, DateOnly today, CancellationToken ct) => throw new NotSupportedException();
        public Task<bool> DeactivateAsync(int personId, int actorId, DateTime nowUtc, CancellationToken ct) => throw new NotSupportedException();
        public Task<CampusDriverPage> SearchAsync(string? query, int page, int pageSize, bool includeInactive, CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<EntrySuggestion>> SuggestAsync(string query, string platePrefix, int actorId, EntrySuggestionWindow window, CancellationToken ct) => throw new NotSupportedException();
    }
}
