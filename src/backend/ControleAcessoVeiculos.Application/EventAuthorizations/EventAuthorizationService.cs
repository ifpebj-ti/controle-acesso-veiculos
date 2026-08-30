using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.EventAuthorizations;

public sealed class EventAuthorizationService(
    IEventAuthorizationStore store,
    TimeProvider timeProvider)
{
    private static readonly TimeSpan DefaultSearchPeriod = TimeSpan.FromDays(30);
    private static readonly TimeSpan MaximumSearchPeriod = TimeSpan.FromDays(366);

    public Task<EventAuthorizationOperationResult> CreateAsync(
        CreateEventAuthorizationCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default) =>
        SaveAsync(command, null, actorUserId, cancellationToken);

    public Task<EventAuthorizationOperationResult> UpdateAsync(
        int eventId,
        UpdateEventAuthorizationCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default) =>
        SaveAsync(
            new CreateEventAuthorizationCommand(
                command.Name,
                command.Responsible,
                command.StartsAtUtc,
                command.EndsAtUtc,
                command.Area,
                command.OvernightAllowed,
                command.VehicleRules,
                command.Notes),
            eventId,
            actorUserId,
            cancellationToken);

    public async Task<SearchEventAuthorizationsResult> SearchAsync(
        SearchEventAuthorizationsCommand command,
        CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow();
        var fromUtc = (command.FromUtc ?? now).ToUniversalTime();
        var toUtc = (command.ToUtc ?? now.Add(DefaultSearchPeriod)).ToUniversalTime();
        var errors = new Dictionary<string, string[]>();

        if (fromUtc >= toUtc || toUtc - fromUtc > MaximumSearchPeriod)
        {
            errors["period"] =
                ["O período deve ter início anterior ao fim e possuir no máximo 366 dias."];
        }

        if (command.Name?.Trim().Length > 200)
        {
            errors["name"] = ["O nome deve possuir até 200 caracteres."];
        }

        if (command.Page is <= 0 or > 10000)
        {
            errors["page"] = ["A página deve estar entre 1 e 10000."];
        }

        if (command.PageSize is <= 0 or > 100)
        {
            errors["pageSize"] = ["O tamanho da página deve estar entre 1 e 100."];
        }

        if (errors.Count > 0)
        {
            return new(EventAuthorizationOperationStatus.Invalid, null, errors);
        }

        var result = await store.SearchAsync(
            new EventAuthorizationSearchCriteria(
                fromUtc.UtcDateTime,
                toUtc.UtcDateTime,
                NormalizeOptional(command.Name),
                command.Active,
                command.Page,
                command.PageSize),
            cancellationToken);

        return new(EventAuthorizationOperationStatus.Success, result, EmptyErrors());
    }

    public async Task<EventAuthorizationOperationResult> CancelAsync(
        int eventId,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        if (eventId <= 0)
        {
            return Invalid("eventId", "O identificador do evento deve ser positivo.");
        }

        var status = await store.TryCancelAsync(
            eventId,
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        return new(
            status switch
            {
                EventAuthorizationStoreStatus.Success => EventAuthorizationOperationStatus.Success,
                EventAuthorizationStoreStatus.NotFound => EventAuthorizationOperationStatus.NotFound,
                _ => EventAuthorizationOperationStatus.Conflict
            },
            null,
            EmptyErrors());
    }

    private async Task<EventAuthorizationOperationResult> SaveAsync(
        CreateEventAuthorizationCommand command,
        int? eventId,
        int actorUserId,
        CancellationToken cancellationToken)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);
        var errors = Validate(command);

        if (eventId is <= 0)
        {
            errors["eventId"] = ["O identificador do evento deve ser positivo."];
        }

        if (errors.Count > 0)
        {
            return new(EventAuthorizationOperationStatus.Invalid, null, errors);
        }

        var data = new EventAuthorizationData(
            command.Name!.Trim(),
            command.Responsible!.Trim(),
            command.StartsAtUtc.ToUniversalTime().UtcDateTime,
            command.EndsAtUtc.ToUniversalTime().UtcDateTime,
            command.Area!.Trim(),
            command.OvernightAllowed,
            NormalizeOptional(command.Notes),
            command.VehicleRules!.Select(rule => new EventVehicleRuleData(
                rule.VehicleType!.Trim().ToUpperInvariant(),
                rule.Quantity,
                NormalizePlate(rule.Plate))).ToArray());
        var occurredAtUtc = timeProvider.GetUtcNow().UtcDateTime;
        var stored = eventId.HasValue
            ? await store.TryUpdateAsync(
                eventId.Value, data, actorUserId, occurredAtUtc, cancellationToken)
            : await store.TryCreateAsync(
                data, actorUserId, occurredAtUtc, cancellationToken);

        return new(
            stored.Status switch
            {
                EventAuthorizationStoreStatus.Success => EventAuthorizationOperationStatus.Success,
                EventAuthorizationStoreStatus.NotFound => EventAuthorizationOperationStatus.NotFound,
                _ => EventAuthorizationOperationStatus.Conflict
            },
            stored.Event,
            EmptyErrors());
    }

    private static Dictionary<string, string[]> Validate(
        CreateEventAuthorizationCommand command)
    {
        var errors = new Dictionary<string, string[]>();
        ValidateRequired(command.Name, 200, "name", "nome", errors);
        ValidateRequired(command.Responsible, 200, "responsible", "responsável", errors);
        ValidateRequired(command.Area, 200, "area", "local ou área", errors);

        if (command.StartsAtUtc == default || command.EndsAtUtc <= command.StartsAtUtc)
        {
            errors["period"] = ["O início do evento deve ser anterior ao fim."];
        }

        if (command.Notes?.Trim().Length > 1000)
        {
            errors["notes"] = ["A observação deve possuir até 1000 caracteres."];
        }

        if (command.VehicleRules is null or { Count: 0 } or { Count: > 100 })
        {
            errors["vehicleRules"] = ["Informe entre 1 e 100 regras de veículos."];
            return errors;
        }

        var plates = new HashSet<string>(StringComparer.Ordinal);
        var quotaTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var index = 0; index < command.VehicleRules.Count; index++)
        {
            var rule = command.VehicleRules[index];
            var key = $"vehicleRules[{index}]";

            if (string.IsNullOrWhiteSpace(rule.VehicleType) ||
                rule.VehicleType.Trim().Length > 50 ||
                rule.Quantity is <= 0 or > 1000)
            {
                errors[key] =
                    ["O tipo é obrigatório, deve possuir até 50 caracteres e a quantidade deve estar entre 1 e 1000."];
                continue;
            }

            string? plate;
            try
            {
                plate = NormalizePlate(rule.Plate);
            }
            catch (ArgumentException)
            {
                errors[key] = ["A placa deve conter letras ou números."];
                continue;
            }

            if (plate is not null && !plates.Add(plate))
            {
                errors[key] = ["A placa não pode ser repetida no mesmo evento."];
            }
            else if (plate?.Length > 10 || plate is not null && rule.Quantity != 1)
            {
                errors[key] =
                    ["A placa deve possuir até 10 caracteres e, quando informada, autoriza exatamente um veículo."];
            }
            else if (plate is null && !quotaTypes.Add(rule.VehicleType.Trim()))
            {
                errors[key] = ["A cota por tipo de veículo não pode ser repetida."];
            }
        }

        return errors;
    }

    private static void ValidateRequired(
        string? value,
        int maximumLength,
        string key,
        string label,
        IDictionary<string, string[]> errors)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > maximumLength)
        {
            errors[key] = [$"O {label} é obrigatório e deve possuir até {maximumLength} caracteres."];
        }
    }

    private static string? NormalizePlate(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : Veiculo.NormalizarPlaca(value);

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static EventAuthorizationOperationResult Invalid(string key, string message) =>
        new(
            EventAuthorizationOperationStatus.Invalid,
            null,
            new Dictionary<string, string[]> { [key] = [message] });

    private static IReadOnlyDictionary<string, string[]> EmptyErrors() =>
        new Dictionary<string, string[]>();
}
