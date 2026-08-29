namespace ControleAcessoVeiculos.Application.InstitutionalVehicles;

public sealed record CreateInstitutionalVehicleCommand(
    string? Plate,
    string? Identification,
    string? VehicleType = null,
    string? Brand = null,
    string? Model = null,
    string? Color = null,
    int? Year = null);

public sealed record InstitutionalVehicleData(
    string? Plate,
    string? Identification,
    string? VehicleType,
    string? Brand,
    string? Model,
    string? Color,
    int? Year);

public sealed record InstitutionalVehicleRecord(
    int Id,
    string? Plate,
    string? Identification,
    string? VehicleType,
    string? Brand,
    string? Model,
    string? Color,
    int? Year,
    DateTime CreatedAtUtc);

public enum CreateInstitutionalVehicleStatus
{
    Success,
    Invalid,
    Conflict
}

public sealed record CreateInstitutionalVehicleResult(
    CreateInstitutionalVehicleStatus Status,
    InstitutionalVehicleRecord? Vehicle,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public static CreateInstitutionalVehicleResult Success(
        InstitutionalVehicleRecord vehicle) =>
        new(
            CreateInstitutionalVehicleStatus.Success,
            vehicle,
            new Dictionary<string, string[]>());

    public static CreateInstitutionalVehicleResult Invalid(
        IReadOnlyDictionary<string, string[]> errors) =>
        new(CreateInstitutionalVehicleStatus.Invalid, null, errors);

    public static CreateInstitutionalVehicleResult Conflict() =>
        new(
            CreateInstitutionalVehicleStatus.Conflict,
            null,
            new Dictionary<string, string[]>
            {
                ["vehicle"] = ["Já existe um veículo com a placa ou identificação informada."]
            });
}

public enum InstitutionalVehicleStoreRegistrationStatus
{
    Success,
    Conflict
}

public sealed record InstitutionalVehicleStoreRegistration(
    InstitutionalVehicleStoreRegistrationStatus Status,
    InstitutionalVehicleRecord? Vehicle);
