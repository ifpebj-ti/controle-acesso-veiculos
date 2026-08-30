namespace ControleAcessoVeiculos.Application.EventAuthorizations;

public sealed record EventVehicleRuleInput(
    string? VehicleType,
    int Quantity,
    string? Plate = null);

public sealed record CreateEventAuthorizationCommand(
    string? Name,
    string? Responsible,
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    string? Area,
    bool OvernightAllowed,
    IReadOnlyList<EventVehicleRuleInput>? VehicleRules,
    string? Notes = null);

public sealed record UpdateEventAuthorizationCommand(
    string? Name,
    string? Responsible,
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    string? Area,
    bool OvernightAllowed,
    IReadOnlyList<EventVehicleRuleInput>? VehicleRules,
    string? Notes = null);

public sealed record EventVehicleRuleData(
    string VehicleType,
    int Quantity,
    string? Plate);

public sealed record EventAuthorizationData(
    string Name,
    string Responsible,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string Area,
    bool OvernightAllowed,
    string? Notes,
    IReadOnlyList<EventVehicleRuleData> VehicleRules);

public sealed record EventVehicleRuleRecord(
    int Id,
    string VehicleType,
    int Quantity,
    string? Plate);

public sealed record EventAuthorizationRecord(
    int Id,
    string Name,
    string Responsible,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string Area,
    bool OvernightAllowed,
    string? Notes,
    bool Active,
    int CreatedById,
    DateTime CreatedAtUtc,
    int? UpdatedById,
    DateTime? UpdatedAtUtc,
    IReadOnlyList<EventVehicleRuleRecord> VehicleRules);

public sealed record SearchEventAuthorizationsCommand(
    DateTimeOffset? FromUtc = null,
    DateTimeOffset? ToUtc = null,
    string? Name = null,
    bool? Active = true,
    int Page = 1,
    int PageSize = 25);

public sealed record EventAuthorizationSearchCriteria(
    DateTime FromUtc,
    DateTime ToUtc,
    string? Name,
    bool? Active,
    int Page,
    int PageSize);

public sealed record PagedEventAuthorizations(
    IReadOnlyList<EventAuthorizationRecord> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public enum EventAuthorizationOperationStatus
{
    Success,
    Invalid,
    NotFound,
    Conflict
}

public sealed record EventAuthorizationOperationResult(
    EventAuthorizationOperationStatus Status,
    EventAuthorizationRecord? Event,
    IReadOnlyDictionary<string, string[]> Errors);

public sealed record SearchEventAuthorizationsResult(
    EventAuthorizationOperationStatus Status,
    PagedEventAuthorizations? Result,
    IReadOnlyDictionary<string, string[]> Errors);

public enum EventAuthorizationStoreStatus
{
    Success,
    NotFound,
    Conflict
}

public sealed record EventAuthorizationStoreResult(
    EventAuthorizationStoreStatus Status,
    EventAuthorizationRecord? Event);
