namespace ControleAcessoVeiculos.Application.AdministrativeReports;

public sealed record AdministrativeReportPeriod(
    DateOnly From,
    DateOnly To,
    int Page = 1,
    int PageSize = 25);

public sealed record VehicleMovementReportQuery(
    DateOnly From,
    DateOnly To,
    string? Plate = null,
    string? DriverName = null,
    string? CategoryName = null,
    string? Status = null,
    int Page = 1,
    int PageSize = 25);

public sealed record InstitutionalFleetReportQuery(
    DateOnly From,
    DateOnly To,
    string? Plate = null,
    string? VehicleIdentification = null,
    string? DriverName = null,
    string? Status = null,
    int Page = 1,
    int PageSize = 25);

public sealed record AdministrativeReportCriteria(
    DateOnly From,
    DateOnly To,
    DateTime FromUtc,
    DateTime ToExclusiveUtc,
    string? Plate,
    string? DriverName,
    string? CategoryName,
    string? VehicleIdentification,
    string? Status,
    int Page,
    int PageSize);

public sealed record ReportActor(int UserId, string Name, string Profile);

public sealed record VehicleMovementReportItem(
    int Id,
    DateTime EntryAtUtc,
    DateTime? ExitAtUtc,
    string DriverName,
    string? VehicleType,
    string? Plate,
    string? VehicleIdentification,
    string CategoryName,
    string Objective,
    string Status,
    string? ClosureType,
    string? EventName,
    ReportActor EntryRecordedBy,
    ReportActor? ExitRecordedBy);

public sealed record InstitutionalFleetReportItem(
    int Id,
    string? Plate,
    string? VehicleIdentification,
    string DriverName,
    DateTime DepartureAtUtc,
    int DepartureMileage,
    DateTime? ReturnAtUtc,
    int? ReturnMileage,
    int? Distance,
    string Itinerary,
    string Status,
    ReportActor DepartureRecordedBy,
    ReportActor? ReturnRecordedBy);

public sealed record PagedAdministrativeReport<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    DateOnly From,
    DateOnly To,
    string TimeZoneId);

public sealed record AdministrativeReportExport<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    DateOnly From,
    DateOnly To,
    string TimeZoneId,
    DateTime GeneratedAtUtc,
    string GeneratedBy,
    IReadOnlyDictionary<string, string?> Filters);

public sealed record GeneratedAdministrativeReport(
    byte[] Content,
    string FileName);

public enum AdministrativeReportExportConfirmationStatus
{
    Success = 1,
    Unauthorized = 2
}

public sealed record AdministrativeReportExportConfirmation(
    AdministrativeReportExportConfirmationStatus Status,
    string? ActorName)
{
    public static AdministrativeReportExportConfirmation Success(string actorName) =>
        new(AdministrativeReportExportConfirmationStatus.Success, actorName);

    public static AdministrativeReportExportConfirmation Unauthorized() =>
        new(AdministrativeReportExportConfirmationStatus.Unauthorized, null);
}

public enum AdministrativeReportExportStatus
{
    Success = 1,
    Invalid = 2,
    Unauthorized = 3,
    TooLarge = 4,
    GenerationFailed = 5
}

public sealed record AdministrativeReportExportResult(
    AdministrativeReportExportStatus Status,
    GeneratedAdministrativeReport? Report,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public static AdministrativeReportExportResult Success(
        GeneratedAdministrativeReport report) =>
        new(AdministrativeReportExportStatus.Success, report, EmptyErrors);

    public static AdministrativeReportExportResult Failure(
        AdministrativeReportExportStatus status,
        IReadOnlyDictionary<string, string[]>? errors = null) =>
        new(status, null, errors ?? EmptyErrors);

    private static readonly IReadOnlyDictionary<string, string[]> EmptyErrors =
        new Dictionary<string, string[]>();
}

public enum AdministrativeReportStatus
{
    Success,
    Invalid
}

public sealed record AdministrativeReportResult<T>(
    AdministrativeReportStatus Status,
    PagedAdministrativeReport<T>? Report,
    IReadOnlyDictionary<string, string[]> Errors);
