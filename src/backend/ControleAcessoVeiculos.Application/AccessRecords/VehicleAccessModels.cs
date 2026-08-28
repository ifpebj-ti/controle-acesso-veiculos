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
    string? Observation = null);

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
    string? Observation);

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
    string? Observation);

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
    Conflict
}

public sealed record VehicleAccessStoreRegistration(
    VehicleAccessStoreRegistrationStatus Status,
    VehicleAccessRecord? AccessRecord);
