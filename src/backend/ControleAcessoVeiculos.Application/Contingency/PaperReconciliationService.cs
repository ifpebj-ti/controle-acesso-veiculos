using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.Contingency;

/// <summary>Application orchestration only; no public endpoint or persistence is enabled.</summary>
public sealed class PaperReconciliationService(
    IPaperReconciliationStore store,
    TimeProvider timeProvider)
{
    // The future API must resolve actor/profile from the authenticated, active account.
    public async Task<PaperReconciliationResult> ImportAsync(
        ImportPaperAccessCommand command,
        int actorUserId,
        string profileName,
        CancellationToken cancellationToken = default)
    {
        if (actorUserId <= 0 || profileName is not (ProfileNames.Doorman or ProfileNames.SecurityGuard))
            return new(PaperReconciliationStatus.Forbidden);
        cancellationToken.ThrowIfCancellationRequested();
        var now = timeProvider.GetUtcNow();
        var errors = command.Entry is null
            ? new Dictionary<string, string[]> { ["entry"] = ["Informe os dados do acesso."] }
            : VehicleAccessService.Validate(command.Entry, now.Year);
        if (command.RequestKey == Guid.Empty)
            errors["requestKey"] = ["Informe a chave da intenção."];
        if (command.IncidentId == Guid.Empty)
            errors["incidentId"] = ["Informe o incidente."];
        if (command.LineNumber <= 0)
            errors["lineNumber"] = ["Informe uma linha positiva."];
        ValidateText(command.PaperAuthorReference, 1, 120, "paperAuthorReference", errors);
        ValidateText(command.Justification, 10, 500, "justification", errors);
        if (command.ObservedEntryAt == default || command.ObservedEntryAt > now)
            errors["observedEntryAt"] = ["Informe a entrada observada, sem horário futuro."];
        if (command.ObservedExitAt is { } exit &&
            (exit == default || exit < command.ObservedEntryAt || exit > now))
            errors["observedExitAt"] = ["A saída observada deve estar entre a entrada e a digitação."];
        if (errors.Count > 0)
            return new(PaperReconciliationStatus.Invalid, Errors: errors);

        var entry = command.Entry!;
        AccessCategoryNames.TryGetCanonicalName(entry.CategoryName, out var category);
        var data = new PaperImportData(
            command.RequestKey, command.IncidentId, command.LineNumber,
            command.PaperAuthorReference.Trim(), command.ObservedEntryAt.UtcDateTime,
            command.ObservedExitAt?.UtcDateTime, command.Justification.Trim(),
            new VehicleEntryData(
                entry.DriverName.Trim(), Veiculo.NormalizarPlaca(entry.Plate),
                entry.Objective.Trim(), category, Optional(entry.DocumentType)?.ToUpperInvariant(),
                Optional(entry.DocumentNumber), Optional(entry.VehicleType), Optional(entry.Brand),
                Optional(entry.Model), Optional(entry.Color), entry.Year, Optional(entry.Observation),
                entry.EventAuthorizationId, entry.VehicleId, entry.PersonId));
        return await store.TryImportAsync(data, actorUserId, now.UtcDateTime, cancellationToken);
    }

    public async Task<PaperReconciliationResult> ReviewAsync(
        int accessRecordId,
        ReviewPaperAccessCommand command,
        int actorUserId,
        string profileName,
        CancellationToken cancellationToken = default)
    {
        if (actorUserId <= 0 || profileName is not (ProfileNames.TransportationDepartment or ProfileNames.Administrator))
            return new(PaperReconciliationStatus.Forbidden);
        cancellationToken.ThrowIfCancellationRequested();
        var errors = new Dictionary<string, string[]>();
        if (accessRecordId <= 0)
            errors["accessRecordId"] = ["Informe um acesso positivo."];
        ValidateText(command.Reason, 10, 500, "reason", errors);
        if (errors.Count > 0)
            return new(PaperReconciliationStatus.Invalid, Errors: errors);
        return await store.TryReviewAsync(accessRecordId, command.Accept, command.Reason.Trim(),
            actorUserId, timeProvider.GetUtcNow().UtcDateTime, cancellationToken);
    }

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void ValidateText(string? value, int min, int max, string field,
        Dictionary<string, string[]> errors)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length < min || value.Trim().Length > max)
            errors[field] = [$"Informe de {min} a {max} caracteres."];
    }
}
