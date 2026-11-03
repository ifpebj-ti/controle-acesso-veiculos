using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.AccessRecords;

public sealed class AccessCorrectionReviewService(IAccessCorrectionReviewStore store, TimeProvider timeProvider)
{
    public Task<AccessCorrectionOperationResult> SubmitAsync(
        int accessRecordId,
        SubmitAccessCorrectionCommand command,
        int actorId,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (command.RequestKey == Guid.Empty)
        {
            errors["requestKey"] = ["Informe uma chave de requisição válida."];
        }

        ValidateValues(command.Original, command.Justification, "original", errors);
        ValidateValues(command.Proposed, command.Justification, "proposed", errors);
        if (accessRecordId <= 0 || actorId <= 0)
        {
            errors["request"] = ["Identificação de registro ou ator inválida."];
        }

        if (errors.Count > 0)
        {
            return Task.FromResult(new AccessCorrectionOperationResult(
                AccessCorrectionOperationStatus.Invalid, Errors: errors));
        }

        return store.SubmitAsync(
            accessRecordId,
            command with
            {
                Original = Normalize(command.Original),
                Proposed = Normalize(command.Proposed),
                Justification = command.Justification.Trim()
            },
            actorId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);
    }

    public Task<AccessCorrectionOperationResult> DecideAsync(
        int requestId, StatusSolicitacaoCorrecao decision, string reason,
        int actorId, CancellationToken cancellationToken)
    {
        if (requestId <= 0 || actorId <= 0 ||
            decision is not (StatusSolicitacaoCorrecao.Aprovada or
                StatusSolicitacaoCorrecao.Rejeitada or StatusSolicitacaoCorrecao.Cancelada) ||
            string.IsNullOrWhiteSpace(reason) || reason.Trim().Length is < 10 or > 500)
        {
            return Task.FromResult(new AccessCorrectionOperationResult(
                AccessCorrectionOperationStatus.Invalid, Errors: new Dictionary<string, string[]>
                {
                    ["decision"] = ["Informe decisão e justificativa válidas, com motivo de 10 a 500 caracteres."]
                }));
        }

        return store.DecideAsync(requestId, decision, reason.Trim(), actorId,
            timeProvider.GetUtcNow().UtcDateTime, cancellationToken);
    }

    private static void ValidateValues(
        AccessCorrectionValues? values, string justification, string prefix,
        Dictionary<string, string[]> errors)
    {
        if (values is null)
        {
            errors[prefix] = ["Informe os dados descritivos."];
            return;
        }

        foreach (var (key, messages) in VehicleAccessService.ValidateCorrection(
            new(values.Objective, values.CategoryName, values.Observation, justification)))
        {
            errors[key == "justification" ? key : $"{prefix}.{key}"] = messages;
        }
    }

    private static AccessCorrectionValues Normalize(AccessCorrectionValues values)
    {
        AccessCategoryNames.TryGetCanonicalName(values.CategoryName, out var category);
        return new(category, values.Objective.Trim(),
            string.IsNullOrWhiteSpace(values.Observation) ? null : values.Observation.Trim());
    }
}
