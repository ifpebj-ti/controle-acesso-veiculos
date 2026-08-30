using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Auditing;

public sealed record SearchAuditTrailCommand(
    DateTimeOffset? FromUtc = null,
    DateTimeOffset? ToUtc = null,
    string? Action = null,
    string? Entity = null,
    int? RecordId = null,
    int? ActorUserId = null,
    bool? SystemOnly = null,
    int Page = 1,
    int PageSize = 25);

public sealed record AuditTrailSearchCriteria(
    DateTime FromUtc,
    DateTime ToUtc,
    TipoAcaoAuditoria? Action,
    string? Entity,
    int? RecordId,
    int? ActorUserId,
    bool? SystemOnly,
    int Page,
    int PageSize);

public sealed record AuditTrailRecord(
    int Id,
    DateTime OccurredAtUtc,
    string Action,
    string Entity,
    int RecordId,
    int? ActorUserId,
    string? Details,
    string? PreviousStateJson,
    string? NewStateJson);

public sealed record PagedAuditTrailResult(
    IReadOnlyList<AuditTrailRecord> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public enum SearchAuditTrailStatus
{
    Success,
    Invalid
}

public sealed record SearchAuditTrailResult(
    SearchAuditTrailStatus Status,
    PagedAuditTrailResult? Result,
    IReadOnlyDictionary<string, string[]> Errors);
