namespace ControleAcessoVeiculos.Application.Contingency;

public sealed record PaperIncidentResult(PaperReconciliationStatus Status,
    PaperIncidentRecord? Incident = null, IReadOnlyDictionary<string, string[]>? Errors = null);

public sealed class PaperIncidentService(IPaperReconciliationCatalog catalog, TimeProvider clock)
{
    public async Task<PaperIncidentResult> RegisterAsync(RegisterPaperIncidentCommand command,
        int actorUserId, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var errors = new Dictionary<string, string[]>();
        if (command.IncidentId == Guid.Empty) errors["incidentId"] = ["Informe a chave do incidente."];
        if (string.IsNullOrWhiteSpace(command.PaperReference) || command.PaperReference.Trim().Length is < 3 or > 120 ||
            command.PaperReference.Any(char.IsControl))
            errors["paperReference"] = ["Informe de 3 a 120 caracteres, sem caracteres de controle."];
        if (command.StartedAt == default || command.EndedAt == default ||
            command.EndedAt < command.StartedAt || command.EndedAt > now)
            errors["period"] = ["Informe o período da indisponibilidade, sem horários futuros."];
        if (errors.Count > 0) return new(PaperReconciliationStatus.Invalid, Errors: errors);
        var result = await catalog.RegisterIncidentAsync(command, actorUserId, now.UtcDateTime, ct);
        return result is null ? new(PaperReconciliationStatus.Conflict) : new(PaperReconciliationStatus.Success, result);
    }
}
