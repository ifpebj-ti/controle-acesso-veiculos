using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Policies;

namespace ControleAcessoVeiculos.Application.CampusDrivers;

public sealed class CampusDriverService(ICampusDriverStore store,
    TimeProvider timeProvider, TimeZoneInfo institutionalTimeZone)
{
    public Task<CampusDriverResult> RegisterAsync(RegisterCampusDriverCommand command,
        int actorId, CancellationToken ct = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorId);
        var errors = ValidateVehicle(command.Plate, command.VehicleType);
        if (string.IsNullOrWhiteSpace(command.Name) || command.Name.Trim().Length > 200 ||
            command.Name.Any(char.IsControl))
            errors["name"] = ["Informe o nome completo com até 200 caracteres, sem controles."];
        var affiliation = CampusDriverPolicy.NormalizeAffiliation(command.Affiliation);
        if (affiliation is null) errors["affiliation"] = ["Escolha Aluno, Terceirizado ou Federal (servidor federal)."];
        var window = CurrentWindow();
        if (!CampusDriverPolicy.IsAdult(command.BirthDate, window.Today))
            errors["birthDate"] = ["O pré-cadastro de condutor exige idade mínima de 18 anos na data institucional."];
        if (!command.BirthDateConfirmed)
            errors["birthDateConfirmed"] = ["Confirme a data de nascimento conferida com a pessoa/documento apropriado."];
        if (errors.Count > 0) return Task.FromResult(new CampusDriverResult(CampusDriverStatus.Invalid, null, errors));
        return store.RegisterAsync(command with
        {
            Name = command.Name.Trim(),
            Affiliation = affiliation!,
            Plate = Veiculo.NormalizarPlaca(command.Plate),
            VehicleType = command.VehicleType.Trim()
        }, actorId,
            timeProvider.GetUtcNow().UtcDateTime, window.Today, ct);
    }

    public Task<CampusDriverResult> AddVehicleAsync(int personId,
        AddCampusDriverVehicleCommand command, int actorId, CancellationToken ct = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(personId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorId);
        var errors = ValidateVehicle(command.Plate, command.VehicleType);
        if (errors.Count > 0) return Task.FromResult(new CampusDriverResult(CampusDriverStatus.Invalid, null, errors));
        return store.AddVehicleAsync(personId, command with
        {
            Plate = Veiculo.NormalizarPlaca(command.Plate),
            VehicleType = command.VehicleType.Trim()
        },
            actorId, timeProvider.GetUtcNow().UtcDateTime, CurrentWindow().Today, ct);
    }

    public Task<bool> DeactivateAsync(int personId, int actorId, CancellationToken ct = default) =>
        store.DeactivateAsync(personId, actorId, timeProvider.GetUtcNow().UtcDateTime, ct);

    public Task<CampusDriverPage> SearchAsync(string? query, int page, int pageSize,
        bool includeInactive, CancellationToken ct = default) =>
        store.SearchAsync(query?.Trim(), page, pageSize, includeInactive, ct);

    public Task<IReadOnlyList<EntrySuggestion>> SuggestAsync(string query, int actorId, CancellationToken ct = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorId);
        var normalized = query.Trim();
        var plate = new string(normalized.Where(char.IsAsciiLetterOrDigit).ToArray()).ToUpperInvariant();
        return store.SuggestAsync(normalized, plate.Length <= 7 ? plate : "", actorId, CurrentWindow(), ct);
    }

    public EntrySuggestionWindow CurrentWindow()
    {
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), institutionalTimeZone).DateTime);
        return new(today,
            TimeZoneInfo.ConvertTimeToUtc(today.ToDateTime(TimeOnly.MinValue), institutionalTimeZone),
            TimeZoneInfo.ConvertTimeToUtc(today.AddDays(1).ToDateTime(TimeOnly.MinValue), institutionalTimeZone),
            today.AddYears(-18));
    }

    private static Dictionary<string, string[]> ValidateVehicle(string plate, string type)
    {
        var errors = new Dictionary<string, string[]>();
        try { Veiculo.NormalizarPlaca(plate); }
        catch (ArgumentException) { errors["plate"] = ["Use uma placa completa válida: ABC-1234 ou ABC1D23."]; }
        if (string.IsNullOrWhiteSpace(type) || type.Trim().Length > 50 || type.Any(char.IsControl))
            errors["vehicleType"] = ["Informe o tipo do veículo com até 50 caracteres, sem controles."];
        return errors;
    }
}
