namespace ControleAcessoVeiculos.Application.CampusDrivers;

public sealed record RegisterCampusDriverCommand(
    string Name, string Affiliation, DateOnly BirthDate, bool BirthDateConfirmed,
    string Plate, string VehicleType, bool ConfirmPossibleDuplicate = false);
public sealed record AddCampusDriverVehicleCommand(string Plate, string VehicleType);
public sealed record CampusDriverRecord(
    int PersonId, int VehicleId, string Name, string Affiliation,
    string Plate, string? VehicleType, bool Active, DateTime VerifiedAtUtc);
public sealed record CampusDriverPage(IReadOnlyList<CampusDriverRecord> Items,
    int TotalCount, int Page, int PageSize);
public enum CampusDriverStatus { Success, Invalid, Conflict, NotFound }
public sealed record CampusDriverResult(CampusDriverStatus Status,
    CampusDriverRecord? Item, IReadOnlyDictionary<string, string[]> Errors);
public sealed record EntrySuggestion(int VehicleId, int PersonId, string Plate,
    string DriverName, string? VehicleType, string Source, string? Affiliation,
    string? PreviousObjective, bool HasOpenAccess,
    DateTime? ExpiresAtUtc);
public sealed record EntrySuggestionWindow(DateOnly Today, DateTime FromUtc,
    DateTime ToExclusiveUtc, DateOnly AdultBirthDateCutoff);

public interface ICampusDriverStore
{
    Task<CampusDriverResult> RegisterAsync(RegisterCampusDriverCommand command,
        int actorId, DateTime nowUtc, DateOnly today, CancellationToken ct);
    Task<CampusDriverResult> AddVehicleAsync(int personId,
        AddCampusDriverVehicleCommand command, int actorId, DateTime nowUtc,
        DateOnly today, CancellationToken ct);
    Task<bool> DeactivateAsync(int personId, int actorId, DateTime nowUtc, CancellationToken ct);
    Task<CampusDriverPage> SearchAsync(string? query, int page, int pageSize,
        bool includeInactive, CancellationToken ct);
    Task<IReadOnlyList<EntrySuggestion>> SuggestAsync(string query, string platePrefix,
        int actorId, EntrySuggestionWindow window, CancellationToken ct);
}
