using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.AccessRecords;

public sealed class VehicleAccessService(
    IVehicleAccessStore vehicleAccessStore,
    TimeProvider timeProvider)
{
    private const int CandidateSearchLimit = 10;

    public async Task<RegisterVehicleEntryResult> RegisterEntryAsync(
        RegisterVehicleEntryCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        var errors = Validate(command, timeProvider.GetUtcNow().Year);

        if (errors.Count > 0)
        {
            return RegisterVehicleEntryResult.Invalid(errors);
        }

        AccessCategoryNames.TryGetCanonicalName(command.CategoryName, out var categoryName);
        var entry = new VehicleEntryData(
            command.DriverName.Trim(),
            Veiculo.NormalizarPlaca(command.Plate),
            command.Objective.Trim(),
            categoryName,
            NormalizeOptional(command.DocumentType)?.ToUpperInvariant(),
            NormalizeOptional(command.DocumentNumber),
            NormalizeOptional(command.VehicleType),
            NormalizeOptional(command.Brand),
            NormalizeOptional(command.Model),
            NormalizeOptional(command.Color),
            command.Year,
            NormalizeOptional(command.Observation),
            command.EventAuthorizationId,
            command.VehicleId,
            command.PersonId);

        var stored = await vehicleAccessStore.TryRegisterEntryAsync(
            entry,
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        return stored.Status switch
        {
            VehicleAccessStoreRegistrationStatus.Success =>
                RegisterVehicleEntryResult.Success(stored.AccessRecord!),
            VehicleAccessStoreRegistrationStatus.EventNotFound =>
                RegisterVehicleEntryResult.Conflict("A autorização de evento não foi encontrada."),
            VehicleAccessStoreRegistrationStatus.EventInactive =>
                RegisterVehicleEntryResult.Conflict("A autorização de evento está cancelada."),
            VehicleAccessStoreRegistrationStatus.EventOutsideWindow =>
                RegisterVehicleEntryResult.Conflict("A entrada está fora da janela autorizada do evento."),
            VehicleAccessStoreRegistrationStatus.EventVehicleNotAuthorized =>
                RegisterVehicleEntryResult.Conflict("A placa ou o tipo do veículo não está autorizado para o evento."),
            VehicleAccessStoreRegistrationStatus.EventQuotaExceeded =>
                RegisterVehicleEntryResult.Conflict("A cota de veículos do evento foi atingida."),
            VehicleAccessStoreRegistrationStatus.CandidateUnavailable =>
                RegisterVehicleEntryResult.Conflict(
                    "O veículo ou condutor selecionado não está mais disponível."),
            _ => RegisterVehicleEntryResult.Conflict(
                "O veículo já possui um acesso aberto ou os dados informados estão inativos.")
        };
    }

    public async Task<SearchAccessEntryCandidatesResult> SearchEntryCandidatesAsync(
        SearchAccessEntryCandidatesCommand command,
        CancellationToken cancellationToken = default)
    {
        var query = command.Query?.Trim();
        if (query is null || query.Length is < 3 or > 80)
        {
            return new(
                SearchAccessEntryCandidatesStatus.Invalid,
                [],
                new Dictionary<string, string[]>
                {
                    ["query"] = ["A busca deve possuir entre 3 e 80 caracteres."]
                });
        }

        var platePrefix = NormalizeCandidatePlatePrefix(query);
        var items = await vehicleAccessStore.SearchEntryCandidatesAsync(
            new AccessEntryCandidateSearchCriteria(
                query,
                platePrefix,
                DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime),
                CandidateSearchLimit),
            cancellationToken);

        return new(
            SearchAccessEntryCandidatesStatus.Success,
            items,
            new Dictionary<string, string[]>());
    }

    public Task<IReadOnlyList<VehicleAccessRecord>> ListOpenAsync(
        CancellationToken cancellationToken = default) =>
        vehicleAccessStore.ListOpenAsync(cancellationToken);

    public async Task<SearchVehicleAccessesResult> SearchHistoryAsync(
        SearchVehicleAccessesCommand command,
        CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow();
        var to = command.To?.ToUniversalTime() ?? now;
        var from = command.From?.ToUniversalTime() ?? to.AddDays(-30);
        var errors = ValidateSearch(command, from, to);

        if (errors.Count > 0)
        {
            return new(
                SearchVehicleAccessesStatus.Invalid,
                null,
                errors);
        }

        StatusRegistroAcesso? status = null;
        if (!string.IsNullOrWhiteSpace(command.Status))
        {
            TryParseStatus(command.Status, out var parsedStatus);
            status = parsedStatus;
        }

        string? categoryName = null;
        if (!string.IsNullOrWhiteSpace(command.CategoryName))
        {
            AccessCategoryNames.TryGetCanonicalName(command.CategoryName, out categoryName);
        }

        var result = await vehicleAccessStore.SearchAsync(
            new VehicleAccessSearchCriteria(
                NormalizePlate(command.Plate),
                NormalizeOptional(command.DriverName),
                categoryName,
                status,
                from.UtcDateTime,
                to.UtcDateTime,
                command.Page,
                command.PageSize),
            cancellationToken);

        return new(
            SearchVehicleAccessesStatus.Success,
            result,
            new Dictionary<string, string[]>());
    }

    public Task<CloseVehicleAccessResult> CloseAsync(
        int accessRecordId,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(accessRecordId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        return vehicleAccessStore.TryCloseAsync(
            accessRecordId,
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);
    }

    public async Task<CloseVehicleAccessResult> CloseExceptionallyAsync(
        int accessRecordId,
        ExceptionallyCloseVehicleAccessCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(accessRecordId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        var now = timeProvider.GetUtcNow();
        var errors = ValidateExceptionalClosure(command, now);
        if (errors.Count > 0)
        {
            return new(CloseVehicleAccessStatus.Invalid, null, errors);
        }

        Enum.TryParse<MotivoEncerramentoExcepcional>(
            command.Reason.Trim(),
            true,
            out var reason);

        return await vehicleAccessStore.TryCloseExceptionallyAsync(
            accessRecordId,
            new ExceptionalVehicleAccessClosureData(
                reason,
                command.Observation.Trim(),
                command.ObservedExitAtUtc?.UtcDateTime),
            actorUserId,
            now.UtcDateTime,
            cancellationToken);
    }

    public async Task<CorrectVehicleAccessResult> CorrectAsync(
        int accessRecordId,
        CorrectVehicleAccessCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(accessRecordId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);
        var errors = ValidateCorrection(command);

        if (errors.Count > 0)
        {
            return new(
                CorrectVehicleAccessStatus.Invalid,
                null,
                errors);
        }

        AccessCategoryNames.TryGetCanonicalName(command.CategoryName, out var categoryName);
        var stored = await vehicleAccessStore.TryCorrectAsync(
            accessRecordId,
            new VehicleAccessCorrectionData(
                command.Objective.Trim(),
                categoryName,
                NormalizeOptional(command.Observation),
                command.Justification.Trim()),
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        return stored.Status switch
        {
            VehicleAccessCorrectionStoreStatus.Success => new(
                CorrectVehicleAccessStatus.Success,
                stored.AccessRecord,
                new Dictionary<string, string[]>()),
            VehicleAccessCorrectionStoreStatus.NotFound => new(
                CorrectVehicleAccessStatus.NotFound,
                null,
                new Dictionary<string, string[]>()),
            _ => new(
                CorrectVehicleAccessStatus.Conflict,
                null,
                new Dictionary<string, string[]>
                {
                    ["accessRecord"] = ["A correção não altera os dados do registro."]
                })
        };
    }

    private static Dictionary<string, string[]> Validate(
        RegisterVehicleEntryCommand command,
        int currentYear)
    {
        var errors = new Dictionary<string, string[]>();

        ValidateRequired(command.DriverName, 200, "driverName", "nome do condutor", errors);
        ValidateRequired(command.Objective, 500, "objective", "objetivo", errors);

        if (string.IsNullOrWhiteSpace(command.Plate))
        {
            errors["plate"] = ["A placa é obrigatória."];
        }
        else
        {
            try
            {
                if (Veiculo.NormalizarPlaca(command.Plate).Length > 10)
                {
                    errors["plate"] = ["A placa deve possuir até 10 letras ou números."];
                }
            }
            catch (ArgumentException)
            {
                errors["plate"] = ["A placa deve conter letras ou números."];
            }
        }

        if (!AccessCategoryNames.TryGetCanonicalName(command.CategoryName, out _))
        {
            errors["categoryName"] =
                ["Informe uma categoria preliminar suportada pelo MVP."];
        }

        var hasDocumentType = !string.IsNullOrWhiteSpace(command.DocumentType);
        var hasDocumentNumber = !string.IsNullOrWhiteSpace(command.DocumentNumber);

        if (hasDocumentType != hasDocumentNumber || command.DocumentType?.Trim().Length > 10 ||
            command.DocumentNumber?.Trim().Length > 20)
        {
            errors["document"] =
                ["Tipo e número do documento devem ser informados juntos e respeitar os limites de 10 e 20 caracteres."];
        }

        ValidateOptional(command.VehicleType, 50, "vehicleType", errors);
        ValidateOptional(command.Brand, 80, "brand", errors);
        ValidateOptional(command.Model, 100, "model", errors);
        ValidateOptional(command.Color, 40, "color", errors);
        ValidateOptional(command.Observation, 1000, "observation", errors);

        if (command.EventAuthorizationId is <= 0)
        {
            errors["eventAuthorizationId"] =
                ["O identificador da autorização de evento deve ser positivo."];
        }

        var hasVehicleId = command.VehicleId.HasValue;
        var hasPersonId = command.PersonId.HasValue;
        if (hasVehicleId != hasPersonId || command.VehicleId is <= 0 || command.PersonId is <= 0)
        {
            errors["candidate"] =
                ["Veículo e condutor selecionados devem ser informados juntos."];
        }

        if (command.Year is <= 0 || command.Year > currentYear + 1)
        {
            errors["year"] = ["O ano do veículo deve ser positivo e não pode exceder o próximo ano."];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidateSearch(
        SearchVehicleAccessesCommand command,
        DateTimeOffset from,
        DateTimeOffset to)
    {
        var errors = new Dictionary<string, string[]>();

        if (from > to || to - from > TimeSpan.FromDays(366))
        {
            errors["period"] =
                ["O período deve estar em ordem cronológica e possuir até 366 dias."];
        }

        if (command.Page is <= 0 or > 10000)
        {
            errors["page"] = ["A página deve estar entre 1 e 10000."];
        }

        if (command.PageSize is <= 0 or > 100)
        {
            errors["pageSize"] = ["O tamanho da página deve estar entre 1 e 100."];
        }

        if (!string.IsNullOrWhiteSpace(command.Plate))
        {
            try
            {
                if (Veiculo.NormalizarPlaca(command.Plate).Length > 10)
                {
                    errors["plate"] = ["A placa deve possuir até 10 letras ou números."];
                }
            }
            catch (ArgumentException)
            {
                errors["plate"] = ["A placa deve conter letras ou números."];
            }
        }

        if (!string.IsNullOrWhiteSpace(command.DriverName) &&
            command.DriverName.Trim().Length is < 2 or > 200)
        {
            errors["driverName"] =
                ["O nome do condutor deve possuir entre 2 e 200 caracteres."];
        }

        if (!string.IsNullOrWhiteSpace(command.CategoryName) &&
            !AccessCategoryNames.TryGetCanonicalName(command.CategoryName, out _))
        {
            errors["categoryName"] = ["Informe uma categoria suportada pelo MVP."];
        }

        if (!string.IsNullOrWhiteSpace(command.Status) &&
            !TryParseStatus(command.Status, out _))
        {
            errors["status"] = ["Informe um status de acesso válido."];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidateCorrection(
        CorrectVehicleAccessCommand command)
    {
        var errors = new Dictionary<string, string[]>();

        ValidateRequired(command.Objective, 500, "objective", "objetivo", errors);

        if (!AccessCategoryNames.TryGetCanonicalName(command.CategoryName, out _))
        {
            errors["categoryName"] = ["Informe uma categoria suportada pelo MVP."];
        }

        ValidateOptional(command.Observation, 1000, "observation", errors);

        if (string.IsNullOrWhiteSpace(command.Justification) ||
            command.Justification.Trim().Length is < 10 or > 500)
        {
            errors["justification"] =
                ["A justificativa é obrigatória e deve possuir entre 10 e 500 caracteres."];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidateExceptionalClosure(
        ExceptionallyCloseVehicleAccessCommand command,
        DateTimeOffset now)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(command.Reason) ||
            !Enum.TryParse<MotivoEncerramentoExcepcional>(
                command.Reason.Trim(), true, out var reason) ||
            !Enum.IsDefined(reason))
        {
            errors["reason"] = ["Informe um motivo de encerramento excepcional válido."];
        }

        if (string.IsNullOrWhiteSpace(command.Observation) ||
            command.Observation.Trim().Length is < 10 or > 1000)
        {
            errors["observation"] =
                ["A observação é obrigatória e deve possuir entre 10 e 1000 caracteres."];
        }

        if (command.ObservedExitAtUtc > now)
        {
            errors["observedExitAtUtc"] =
                ["O horário observado de saída não pode estar no futuro."];
        }

        return errors;
    }

    private static void ValidateRequired(
        string? value,
        int maximumLength,
        string field,
        string description,
        IDictionary<string, string[]> errors)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > maximumLength)
        {
            errors[field] = [$"O {description} é obrigatório e deve possuir até {maximumLength} caracteres."];
        }
    }

    private static void ValidateOptional(
        string? value,
        int maximumLength,
        string field,
        IDictionary<string, string[]> errors)
    {
        if (value?.Trim().Length > maximumLength)
        {
            errors[field] = [$"O campo deve possuir até {maximumLength} caracteres."];
        }
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? NormalizePlate(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : Veiculo.NormalizarPlaca(value);

    private static string NormalizeCandidatePlatePrefix(string value)
    {
        try
        {
            return Veiculo.NormalizarPlaca(value);
        }
        catch (ArgumentException)
        {
            return string.Empty;
        }
    }

    private static bool TryParseStatus(
        string value,
        out StatusRegistroAcesso status) =>
        Enum.TryParse(value.Trim(), true, out status) && Enum.IsDefined(status);
}
