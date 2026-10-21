using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.EventAuthorizations;

public sealed record EventVehicleRuleInput(
    string? VehicleType,
    int Quantity,
    string? Plate = null);

public sealed record CreateEventAuthorizationCommand(
    string? Name,
    string? Responsible,
    string? ResponsibleContact,
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    string? Area,
    bool OvernightAllowed,
    string? ParkingLocation,
    IReadOnlyList<EventVehicleRuleInput>? VehicleRules,
    string? Notes = null);

public sealed record UpdateEventAuthorizationCommand(
    string? Name,
    string? Responsible,
    string? ResponsibleContact,
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    string? Area,
    bool OvernightAllowed,
    string? ParkingLocation,
    IReadOnlyList<EventVehicleRuleInput>? VehicleRules,
    string? Notes = null);

public sealed record EventVehicleRuleData(
    string VehicleType,
    int Quantity,
    string? Plate);

public sealed record EventAuthorizationData(
    string Name,
    string Responsible,
    string ResponsibleContact,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string Area,
    bool OvernightAllowed,
    LocalEstacionamentoEvento ParkingLocation,
    string? Notes,
    IReadOnlyList<EventVehicleRuleData> VehicleRules);

public sealed record EventVehicleRuleRecord(
    int Id,
    string VehicleType,
    int Quantity,
    string? Plate,
    int ConsumedQuantity,
    int RemainingQuantity);

public sealed record EventAuthorizationRecord(
    int Id,
    string Name,
    string Responsible,
    string? ResponsibleContact,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string Area,
    bool OvernightAllowed,
    string ParkingLocation,
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
