using ControleAcessoVeiculos.Application.AccessRecords;

namespace ControleAcessoVeiculos.Application.Contingency;

// Actor IDs, import time and review time are supplied by the server, never by these payloads.
public sealed record ImportPaperAccessCommand(
    Guid RequestKey,
    Guid IncidentId,
    int LineNumber,
    string PaperAuthorReference,
    DateTimeOffset ObservedEntryAt,
    DateTimeOffset? ObservedExitAt,
    string Justification,
    RegisterVehicleEntryCommand Entry);

public sealed record ReviewPaperAccessCommand(bool Accept, string Reason);

public sealed record PaperImportData(
    Guid RequestKey,
    Guid IncidentId,
    int LineNumber,
    string PaperAuthorReference,
    DateTime ObservedEntryAtUtc,
    DateTime? ObservedExitAtUtc,
    string Justification,
    VehicleEntryData Entry);

public sealed record PaperReconciliationReceipt(
    int AccessRecordId,
    string ReviewStatus,
    DateTime ImportedAtUtc);

public enum PaperReconciliationStatus
{
    Success,
    Invalid,
    Forbidden,
    NotFound,
    Conflict
}

// The receipt is canonical: a replay must return the original import time and identity.
public sealed record PaperReconciliationResult(
    PaperReconciliationStatus Status,
    PaperReconciliationReceipt? Receipt = null,
    string? Code = null,
    IReadOnlyDictionary<string, string[]>? Errors = null);


public sealed record RegisterPaperIncidentCommand(
    Guid IncidentId, string PaperReference, DateTimeOffset StartedAt, DateTimeOffset EndedAt);

public sealed record PaperIncidentRecord(
    Guid IncidentId, string PaperReference, DateTime StartedAtUtc, DateTime EndedAtUtc,
    int CreatedById, DateTime CreatedAtUtc);

public sealed record PaperReconciliationItem(
    int AccessRecordId, Guid IncidentId, int LineNumber, string PaperAuthorReference,
    int ImportedById, DateTime ObservedEntryAtUtc, DateTime? ObservedExitAtUtc,
    DateTime ImportedAtUtc, string Justification, string ReviewStatus,
    int? ReviewedById, DateTime? ReviewedAtUtc, string? ReviewReason,
    string Plate, string DriverName);

public sealed record PaperReconciliationPage(
    IReadOnlyList<PaperReconciliationItem> Items, int TotalCount, int Page, int PageSize);

public interface IPaperReconciliationCatalog
{
    Task<PaperIncidentRecord?> RegisterIncidentAsync(RegisterPaperIncidentCommand command,
        int actorUserId, DateTime createdAtUtc, CancellationToken ct);
    Task<IReadOnlyList<PaperIncidentRecord>> ListIncidentsAsync(int page, int pageSize, CancellationToken ct);
    Task<PaperReconciliationPage> SearchAsync(string? status, int? importedById,
        int page, int pageSize, CancellationToken ct);
}
