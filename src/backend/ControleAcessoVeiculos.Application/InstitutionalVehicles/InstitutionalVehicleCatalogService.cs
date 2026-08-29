using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.InstitutionalVehicles;

public sealed class InstitutionalVehicleCatalogService(
    IInstitutionalVehicleCatalogStore store,
    TimeProvider timeProvider)
{
    public async Task<CreateInstitutionalVehicleResult> CreateAsync(
        CreateInstitutionalVehicleCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        var now = timeProvider.GetUtcNow();
        var errors = Validate(command, now.Year);

        if (errors.Count > 0)
        {
            return CreateInstitutionalVehicleResult.Invalid(errors);
        }

        var vehicle = new InstitutionalVehicleData(
            NormalizePlate(command.Plate),
            NormalizeIdentification(command.Identification),
            NormalizeOptional(command.VehicleType),
            NormalizeOptional(command.Brand),
            NormalizeOptional(command.Model),
            NormalizeOptional(command.Color),
            command.Year);

        var stored = await store.TryCreateAsync(
            vehicle,
            actorUserId,
            now.UtcDateTime,
            cancellationToken);

        return stored.Status == InstitutionalVehicleStoreRegistrationStatus.Success
            ? CreateInstitutionalVehicleResult.Success(stored.Vehicle!)
            : CreateInstitutionalVehicleResult.Conflict();
    }

    public Task<IReadOnlyList<InstitutionalVehicleRecord>> ListActiveAsync(
        CancellationToken cancellationToken = default) =>
        store.ListActiveAsync(cancellationToken);

    private static Dictionary<string, string[]> Validate(
        CreateInstitutionalVehicleCommand command,
        int currentYear)
    {
        var errors = new Dictionary<string, string[]>();
        var hasPlate = !string.IsNullOrWhiteSpace(command.Plate);
        var hasIdentification = !string.IsNullOrWhiteSpace(command.Identification);

        if (!hasPlate && !hasIdentification)
        {
            errors["identification"] = ["Informe a placa ou a identificação do veículo."];
        }

        if (hasPlate)
        {
            try
            {
                if (Veiculo.NormalizarPlaca(command.Plate!).Length > 10)
                {
                    errors["plate"] = ["A placa deve possuir até 10 letras ou números."];
                }
            }
            catch (ArgumentException)
            {
                errors["plate"] = ["A placa deve conter letras ou números."];
            }
        }

        if (hasIdentification && command.Identification!.Trim().Length > 100)
        {
            errors["identification"] = ["A identificação deve possuir até 100 caracteres."];
        }

        ValidateOptional(command.VehicleType, 50, "vehicleType", errors);
        ValidateOptional(command.Brand, 80, "brand", errors);
        ValidateOptional(command.Model, 100, "model", errors);
        ValidateOptional(command.Color, 40, "color", errors);

        if (command.Year is <= 0 || command.Year > currentYear + 1)
        {
            errors["year"] =
                ["O ano do veículo deve ser positivo e não pode exceder o próximo ano."];
        }

        return errors;
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

    private static string? NormalizePlate(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : Veiculo.NormalizarPlaca(value);

    private static string? NormalizeIdentification(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : Veiculo.NormalizarIdentificacao(value);

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
