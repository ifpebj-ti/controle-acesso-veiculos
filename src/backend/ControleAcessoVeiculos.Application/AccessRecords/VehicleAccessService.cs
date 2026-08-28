using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.AccessRecords;

public sealed class VehicleAccessService(
    IVehicleAccessStore vehicleAccessStore,
    TimeProvider timeProvider)
{
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
            NormalizeOptional(command.Observation));

        var stored = await vehicleAccessStore.TryRegisterEntryAsync(
            entry,
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        return stored.Status == VehicleAccessStoreRegistrationStatus.Success
            ? RegisterVehicleEntryResult.Success(stored.AccessRecord!)
            : RegisterVehicleEntryResult.Conflict(
                "O veículo já possui um acesso aberto ou os dados informados estão inativos.");
    }

    public Task<IReadOnlyList<VehicleAccessRecord>> ListOpenAsync(
        CancellationToken cancellationToken = default) =>
        vehicleAccessStore.ListOpenAsync(cancellationToken);

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

        if (command.Year is <= 0 || command.Year > currentYear + 1)
        {
            errors["year"] = ["O ano do veículo deve ser positivo e não pode exceder o próximo ano."];
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
}
