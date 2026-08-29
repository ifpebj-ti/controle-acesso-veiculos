namespace ControleAcessoVeiculos.Application.InstitutionalVehicleUsages;

public sealed class InstitutionalVehicleUsageService(
    IInstitutionalVehicleUsageStore store,
    TimeProvider timeProvider)
{
    public async Task<RegisterInstitutionalVehicleDepartureResult> RegisterDepartureAsync(
        RegisterInstitutionalVehicleDepartureCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        var errors = ValidateDeparture(command);

        if (errors.Count > 0)
        {
            return new RegisterInstitutionalVehicleDepartureResult(
                RegisterInstitutionalVehicleDepartureStatus.Invalid,
                null,
                errors);
        }

        var stored = await store.TryRegisterDepartureAsync(
            command.VehicleId,
            command.DriverId,
            command.DepartureMileage,
            command.Itinerary!.Trim(),
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        return stored.Status switch
        {
            InstitutionalVehicleDepartureStoreStatus.Success =>
                new(RegisterInstitutionalVehicleDepartureStatus.Success, stored.Usage,
                    EmptyErrors()),
            InstitutionalVehicleDepartureStoreStatus.NotFound =>
                new(RegisterInstitutionalVehicleDepartureStatus.NotFound, null,
                    EmptyErrors()),
            _ => new(RegisterInstitutionalVehicleDepartureStatus.Conflict, null,
                new Dictionary<string, string[]>
                {
                    ["vehicle"] = ["O veículo já possui um uso institucional aberto."]
                })
        };
    }

    public Task<IReadOnlyList<InstitutionalVehicleUsageRecord>> ListOpenAsync(
        CancellationToken cancellationToken = default) =>
        store.ListOpenAsync(cancellationToken);

    public async Task<RegisterInstitutionalVehicleReturnResult> RegisterReturnAsync(
        int usageId,
        RegisterInstitutionalVehicleReturnCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);
        var errors = new Dictionary<string, string[]>();

        if (usageId <= 0)
        {
            errors["usageId"] = ["O identificador do uso deve ser positivo."];
        }

        if (command.ReturnMileage < 0)
        {
            errors["returnMileage"] = ["A quilometragem de retorno não pode ser negativa."];
        }

        if (errors.Count > 0)
        {
            return new RegisterInstitutionalVehicleReturnResult(
                RegisterInstitutionalVehicleReturnStatus.Invalid,
                null,
                errors);
        }

        var stored = await store.TryRegisterReturnAsync(
            usageId,
            command.ReturnMileage,
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        return stored.Status switch
        {
            InstitutionalVehicleReturnStoreStatus.Success =>
                new(RegisterInstitutionalVehicleReturnStatus.Success, stored.Usage,
                    EmptyErrors()),
            InstitutionalVehicleReturnStoreStatus.InvalidMileage =>
                new(RegisterInstitutionalVehicleReturnStatus.Invalid, null,
                    new Dictionary<string, string[]>
                    {
                        ["returnMileage"] =
                            ["A quilometragem de retorno não pode ser inferior à de saída."]
                    }),
            InstitutionalVehicleReturnStoreStatus.NotFound =>
                new(RegisterInstitutionalVehicleReturnStatus.NotFound, null, EmptyErrors()),
            _ => new(RegisterInstitutionalVehicleReturnStatus.Conflict, null, EmptyErrors())
        };
    }

    private static Dictionary<string, string[]> ValidateDeparture(
        RegisterInstitutionalVehicleDepartureCommand command)
    {
        var errors = new Dictionary<string, string[]>();

        if (command.VehicleId <= 0)
        {
            errors["vehicleId"] = ["O identificador do veículo deve ser positivo."];
        }

        if (command.DriverId <= 0)
        {
            errors["driverId"] = ["O identificador do motorista deve ser positivo."];
        }

        if (command.DepartureMileage < 0)
        {
            errors["departureMileage"] = ["A quilometragem de saída não pode ser negativa."];
        }

        if (string.IsNullOrWhiteSpace(command.Itinerary) || command.Itinerary.Trim().Length > 500)
        {
            errors["itinerary"] = ["O itinerário é obrigatório e deve possuir até 500 caracteres."];
        }

        return errors;
    }

    private static IReadOnlyDictionary<string, string[]> EmptyErrors() =>
        new Dictionary<string, string[]>();
}
