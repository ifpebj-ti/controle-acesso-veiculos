namespace ControleAcessoVeiculos.Application.InstitutionalDrivers;

public sealed record AuthorizeInstitutionalDriverCommand(
    string? Name,
    string? DocumentType = null,
    string? DocumentNumber = null);

public sealed record InstitutionalDriverData(
    string Name,
    string? DocumentType,
    string? DocumentNumber);

public sealed record InstitutionalDriverRecord(
    int Id,
    int PersonId,
    string Name,
    DateTime AuthorizedAtUtc,
    int AuthorizedById,
    DateTime? UpdatedAtUtc,
    int? UpdatedById);

public enum AuthorizeInstitutionalDriverStatus
{
    Success,
    Invalid,
    Conflict
}

public sealed record AuthorizeInstitutionalDriverResult(
    AuthorizeInstitutionalDriverStatus Status,
    InstitutionalDriverRecord? Driver,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public static AuthorizeInstitutionalDriverResult Success(
        InstitutionalDriverRecord driver) =>
        new(
            AuthorizeInstitutionalDriverStatus.Success,
            driver,
            new Dictionary<string, string[]>());

    public static AuthorizeInstitutionalDriverResult Invalid(
        IReadOnlyDictionary<string, string[]> errors) =>
        new(AuthorizeInstitutionalDriverStatus.Invalid, null, errors);

    public static AuthorizeInstitutionalDriverResult Conflict() =>
        new(
            AuthorizeInstitutionalDriverStatus.Conflict,
            null,
            new Dictionary<string, string[]>
            {
                ["driver"] =
                    ["A pessoa está inativa ou já possui uma autorização ativa."]
            });
}

public enum InstitutionalDriverStoreAuthorizationStatus
{
    Success,
    Conflict
}

public sealed record InstitutionalDriverStoreAuthorization(
    InstitutionalDriverStoreAuthorizationStatus Status,
    InstitutionalDriverRecord? Driver);

public enum DeactivateInstitutionalDriverStatus
{
    Success,
    NotFound,
    Conflict
}

public sealed record DeactivateInstitutionalDriverResult(
    DeactivateInstitutionalDriverStatus Status);
