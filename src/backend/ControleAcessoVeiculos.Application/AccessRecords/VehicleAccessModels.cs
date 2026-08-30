using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.AccessRecords;

public sealed record RegisterVehicleEntryCommand(
    string DriverName,
    string Plate,
    string Objective,
    string CategoryName,
    string? DocumentType = null,
    string? DocumentNumber = null,
    string? VehicleType = null,
    string? Brand = null,
    string? Model = null,
    string? Color = null,
    int? Year = null,
    string? Observation = null,
    int? EventAuthorizationId = null);

public sealed record VehicleEntryData(
    string DriverName,
    string Plate,
    string Objective,
    string CategoryName,
    string? DocumentType,
    string? DocumentNumber,
    string? VehicleType,
    string? Brand,
    string? Model,
    string? Color,
    int? Year,
    string? Observation,
    int? EventAuthorizationId);

public sealed record VehicleAccessRecord(
    int Id,
    int VehicleId,
    string Plate,
    int PersonId,
    string DriverName,
    string CategoryName,
    string Objective,
    DateTime EntryAtUtc,
    DateTime? ExitAtUtc,
    string Status,
    int CreatedById,
    int? UpdatedById,
    string? Observation,
    int? EventAuthorizationId = null,
    string? EventAuthorizationName = null,
    int? EventVehicleRuleId = null);

public sealed record SearchVehicleAccessesCommand(
    string? Plate = null,
    string? DriverName = null,
    string? CategoryName = null,
    string? Status = null,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    int Page = 1,
    int PageSize = 25);

public sealed record VehicleAccessSearchCriteria(
    string? Plate,
    string? DriverName,
    string? CategoryName,
    StatusRegistroAcesso? Status,
    DateTime FromUtc,
    DateTime ToUtc,
    int Page,
    int PageSize);

public sealed record PagedVehicleAccessResult(
    IReadOnlyList<VehicleAccessRecord> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public enum SearchVehicleAccessesStatus
{
    Success,
    Invalid
}

public sealed record SearchVehicleAccessesResult(
    SearchVehicleAccessesStatus Status,
    PagedVehicleAccessResult? Result,
    IReadOnlyDictionary<string, string[]> Errors);

public sealed record CorrectVehicleAccessCommand(
    string Objective,
    string CategoryName,
    string? Observation,
    string Justification);

public sealed record VehicleAccessCorrectionData(
    string Objective,
    string CategoryName,
    string? Observation,
    string Justification);

public enum CorrectVehicleAccessStatus
{
    Success,
    Invalid,
    NotFound,
    Conflict
}

public sealed record CorrectVehicleAccessResult(
    CorrectVehicleAccessStatus Status,
    VehicleAccessRecord? AccessRecord,
    IReadOnlyDictionary<string, string[]> Errors);

public enum VehicleAccessCorrectionStoreStatus
{
    Success,
    NotFound,
    Conflict
}

public sealed record VehicleAccessCorrectionStoreResult(
    VehicleAccessCorrectionStoreStatus Status,
    VehicleAccessRecord? AccessRecord);

public enum RegisterVehicleEntryStatus
{
    Success,
    Invalid,
    Conflict
}

public sealed record RegisterVehicleEntryResult(
    RegisterVehicleEntryStatus Status,
    VehicleAccessRecord? AccessRecord,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public static RegisterVehicleEntryResult Success(VehicleAccessRecord accessRecord) =>
        new(RegisterVehicleEntryStatus.Success, accessRecord,
            new Dictionary<string, string[]>());

    public static RegisterVehicleEntryResult Invalid(
        IReadOnlyDictionary<string, string[]> errors) =>
        new(RegisterVehicleEntryStatus.Invalid, null, errors);

    public static RegisterVehicleEntryResult Conflict(string message) =>
        new(RegisterVehicleEntryStatus.Conflict, null,
            new Dictionary<string, string[]> { ["accessRecord"] = [message] });
}

public enum CloseVehicleAccessStatus
{
    Success,
    NotFound,
    Conflict
}

public sealed record CloseVehicleAccessResult(
    CloseVehicleAccessStatus Status,
    VehicleAccessRecord? AccessRecord);

public enum VehicleAccessStoreRegistrationStatus
{
    Success,
    Conflict,
    EventNotFound,
    EventInactive,
    EventOutsideWindow,
    EventVehicleNotAuthorized,
    EventQuotaExceeded
}

public sealed record VehicleAccessStoreRegistration(
    VehicleAccessStoreRegistrationStatus Status,
    VehicleAccessRecord? AccessRecord);
