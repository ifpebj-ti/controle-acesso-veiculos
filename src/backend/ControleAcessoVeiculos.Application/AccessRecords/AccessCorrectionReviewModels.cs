namespace ControleAcessoVeiculos.Application.AccessRecords;

public sealed record AccessCorrectionValues(string CategoryName, string Objective, string? Observation);

public sealed record SubmitAccessCorrectionCommand(
    Guid RequestKey,
    AccessCorrectionValues Original,
    AccessCorrectionValues Proposed,
    string Justification);

public sealed record AccessCorrectionRecord(
    int Id,
    int AccessRecordId,
    string? Plate,
    string DriverName,
    string? VehicleIdentification,
    Guid RequestKey,
    string Status,
    int RequestedByUserId,
    DateTime RequestedAtUtc,
    AccessCorrectionValues Original,
    AccessCorrectionValues Proposed,
    string Justification,
    int? DecidedByUserId,
    DateTime? DecidedAtUtc,
    string? DecisionReason);

public sealed record AccessCorrectionPage(
    IReadOnlyList<AccessCorrectionRecord> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public enum AccessCorrectionOperationStatus
{
    Success,
    Invalid,
    NotFound,
    Conflict,
    Forbidden
}

public sealed record AccessCorrectionOperationResult(
    AccessCorrectionOperationStatus Status,
    AccessCorrectionRecord? Request = null,
    bool Created = false,
    IReadOnlyDictionary<string, string[]>? Errors = null);

