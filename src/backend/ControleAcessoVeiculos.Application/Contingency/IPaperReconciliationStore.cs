namespace ControleAcessoVeiculos.Application.Contingency;

/// <summary>
/// Atomic persistence boundary. There is deliberately no implementation or DI registration yet.
/// Import must validate the incident/paper reference, enforce unique incident/line and actor/request
/// keys, reject changed replays and overlapping open accesses, and commit access + provenance +
/// optional paper exit + minimal audit together. Never compose ordinary entry/exit writes here.
/// Event rules must be evaluated at the observed entry time, not silently at import time.
/// </summary>
public interface IPaperReconciliationStore
{
    Task<PaperReconciliationResult> TryImportAsync(
        PaperImportData data,
        int actorUserId,
        DateTime importedAtUtc,
        CancellationToken cancellationToken);

    /// <summary>
    /// Lock and decide atomically using ReconciliacaoContingencia.Conferir: another actor,
    /// immutable terminal decisions, exact replay preserves first decision/time, minimal audit.
    /// A rejection must not remove or close the operational access or erase paper evidence.
    /// </summary>
    Task<PaperReconciliationResult> TryReviewAsync(
        int accessRecordId,
        bool accept,
        string reason,
        int reviewerUserId,
        DateTime reviewedAtUtc,
        CancellationToken cancellationToken);
}
