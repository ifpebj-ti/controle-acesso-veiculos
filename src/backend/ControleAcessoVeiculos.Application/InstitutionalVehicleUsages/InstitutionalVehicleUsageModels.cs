namespace ControleAcessoVeiculos.Application.InstitutionalVehicleUsages;

public sealed record RegisterInstitutionalVehicleDepartureCommand(
    int VehicleId,
    int DriverId,
    int DepartureMileage,
    string? Itinerary);

public sealed record RegisterInstitutionalVehicleReturnCommand(
    int ReturnMileage);

public sealed record SearchInstitutionalVehicleUsagesCommand(
    int? VehicleId = null,
    int? DriverId = null,
    string? Plate = null,
    string? VehicleIdentification = null,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    int Page = 1,
    int PageSize = 25);

public sealed record InstitutionalVehicleUsageSearchCriteria(
    int? VehicleId,
    int? DriverId,
    string? Plate,
    string? VehicleIdentification,
    DateTime FromUtc,
    DateTime ToUtc,
    int Page,
    int PageSize);

public sealed record InstitutionalVehicleUsageRecord(
    int Id,
    int VehicleId,
    string? Plate,
    string? VehicleIdentification,
    int DriverId,
    string DriverName,
    DateTime DepartureAtUtc,
    int DepartureMileage,
    string Itinerary,
    DateTime? ReturnAtUtc,
    int? ReturnMileage,
    string Status,
    int CreatedById,
    int? UpdatedById);

public sealed record PagedInstitutionalVehicleUsageResult(
    IReadOnlyList<InstitutionalVehicleUsageRecord> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public enum SearchInstitutionalVehicleUsagesStatus
{
    Success,
    Invalid
}

public sealed record SearchInstitutionalVehicleUsagesResult(
    SearchInstitutionalVehicleUsagesStatus Status,
    PagedInstitutionalVehicleUsageResult? Result,
    IReadOnlyDictionary<string, string[]> Errors);

public enum RegisterInstitutionalVehicleDepartureStatus
{
    Success,
    Invalid,
    NotFound,
    Conflict
}

public sealed record RegisterInstitutionalVehicleDepartureResult(
    RegisterInstitutionalVehicleDepartureStatus Status,
    InstitutionalVehicleUsageRecord? Usage,
    IReadOnlyDictionary<string, string[]> Errors);

public enum RegisterInstitutionalVehicleReturnStatus
{
    Success,
    Invalid,
    NotFound,
    Conflict
}

public sealed record RegisterInstitutionalVehicleReturnResult(
    RegisterInstitutionalVehicleReturnStatus Status,
    InstitutionalVehicleUsageRecord? Usage,
    IReadOnlyDictionary<string, string[]> Errors);

public enum InstitutionalVehicleDepartureStoreStatus
{
    Success,
    NotFound,
    Conflict
}

public sealed record InstitutionalVehicleDepartureStoreResult(
    InstitutionalVehicleDepartureStoreStatus Status,
    InstitutionalVehicleUsageRecord? Usage);

public enum InstitutionalVehicleReturnStoreStatus
{
    Success,
    InvalidMileage,
    NotFound,
    Conflict
}

public sealed record InstitutionalVehicleReturnStoreResult(
    InstitutionalVehicleReturnStoreStatus Status,
    InstitutionalVehicleUsageRecord? Usage);
