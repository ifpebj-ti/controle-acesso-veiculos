using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Auditing;

public sealed class AuditTrailService(
    IAuditTrailStore store,
    TimeProvider timeProvider)
{
    private static readonly TimeSpan DefaultPeriod = TimeSpan.FromDays(30);
    private static readonly TimeSpan MaximumPeriod = TimeSpan.FromDays(90);

    public async Task<SearchAuditTrailResult> SearchAsync(
        SearchAuditTrailCommand command,
        CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow();
        var fromUtc = (command.FromUtc ?? now.Subtract(DefaultPeriod)).ToUniversalTime();
        var toUtc = (command.ToUtc ?? now).ToUniversalTime();
        var errors = Validate(command, fromUtc, toUtc, out var action);

        if (errors.Count > 0)
        {
            return new(SearchAuditTrailStatus.Invalid, null, errors);
        }

        var result = await store.SearchAsync(
            new AuditTrailSearchCriteria(
                fromUtc.UtcDateTime,
                toUtc.UtcDateTime,
                action,
                NormalizeOptional(command.Entity),
                command.RecordId,
                command.ActorUserId,
                command.SystemOnly,
                command.Page,
                command.PageSize),
            cancellationToken);

        return new(
            SearchAuditTrailStatus.Success,
            result,
            new Dictionary<string, string[]>());
    }

    private static Dictionary<string, string[]> Validate(
        SearchAuditTrailCommand command,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        out TipoAcaoAuditoria? action)
    {
        var errors = new Dictionary<string, string[]>();
        action = null;

        if (fromUtc >= toUtc)
        {
            errors["period"] = ["O início do período deve ser anterior ao fim."];
        }
        else if (toUtc - fromUtc > MaximumPeriod)
        {
            errors["period"] = ["O período de consulta deve possuir no máximo 90 dias."];
        }

        if (!string.IsNullOrWhiteSpace(command.Action))
        {
            if (Enum.TryParse<TipoAcaoAuditoria>(command.Action.Trim(), true, out var parsedAction) &&
                Enum.IsDefined(parsedAction))
            {
                action = parsedAction;
            }
            else
            {
                errors["action"] = ["A ação de auditoria informada é inválida."];
            }
        }

        if (command.Entity?.Trim().Length > 100)
        {
            errors["entity"] = ["A entidade deve possuir até 100 caracteres."];
        }

        if (command.RecordId is <= 0)
        {
            errors["recordId"] = ["O identificador do registro deve ser positivo."];
        }

        if (command.ActorUserId is <= 0)
        {
            errors["actorUserId"] = ["O identificador do ator deve ser positivo."];
        }

        if (command.SystemOnly == true && command.ActorUserId.HasValue)
        {
            errors["actor"] = ["Eventos de sistema não podem ser combinados com um ator humano."];
        }

        if (command.Page is <= 0 or > 10000)
        {
            errors["page"] = ["A página deve estar entre 1 e 10000."];
        }

        if (command.PageSize is <= 0 or > 100)
        {
            errors["pageSize"] = ["O tamanho da página deve estar entre 1 e 100."];
        }

        return errors;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
