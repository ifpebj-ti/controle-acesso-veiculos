using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.AdministrativeReports;

public sealed class AdministrativeReportService(
    IAdministrativeReportStore store,
    TimeZoneInfo institutionalTimeZone)
{
    public async Task<AdministrativeReportResult<VehicleMovementReportItem>>
        SearchVehicleMovementsAsync(
            VehicleMovementReportQuery query,
            int actorUserId,
            CancellationToken cancellationToken)
    {
        var (criteria, errors) = Validate(
            query.From,
            query.To,
            query.Plate,
            query.DriverName,
            query.CategoryName,
            null,
            query.Status,
            query.Page,
            query.PageSize);

        errors = ValidateStatus<StatusRegistroAcesso>(query.Status, errors);

        if (criteria is null || errors.Count > 0)
        {
            return new(AdministrativeReportStatus.Invalid, null, errors);
        }

        var report = await store.SearchVehicleMovementsAsync(
            criteria,
            institutionalTimeZone.Id,
            cancellationToken);
        await store.RecordConsultationAsync(
            actorUserId,
            "VehicleMovements",
            query.From,
            query.To,
            true,
            cancellationToken);

        return new(AdministrativeReportStatus.Success, report, errors);
    }

    public async Task<AdministrativeReportResult<InstitutionalFleetReportItem>>
        SearchInstitutionalFleetAsync(
            InstitutionalFleetReportQuery query,
            int actorUserId,
            CancellationToken cancellationToken)
    {
        var (criteria, errors) = Validate(
            query.From,
            query.To,
            query.Plate,
            query.DriverName,
            null,
            query.VehicleIdentification,
            query.Status,
            query.Page,
            query.PageSize);

        errors = ValidateStatus<StatusUsoVeiculoInstitucional>(query.Status, errors);

        if (criteria is null || errors.Count > 0)
        {
            return new(AdministrativeReportStatus.Invalid, null, errors);
        }

        var report = await store.SearchInstitutionalFleetAsync(
            criteria,
            institutionalTimeZone.Id,
            cancellationToken);
        await store.RecordConsultationAsync(
            actorUserId,
            "InstitutionalFleet",
            query.From,
            query.To,
            true,
            cancellationToken);

        return new(AdministrativeReportStatus.Success, report, errors);
    }

    private (AdministrativeReportCriteria? Criteria,
        IReadOnlyDictionary<string, string[]> Errors) Validate(
        DateOnly from,
        DateOnly to,
        string? plate,
        string? driverName,
        string? categoryName,
        string? vehicleIdentification,
        string? status,
        int page,
        int pageSize)
    {
        var errors = new Dictionary<string, string[]>();

        if (to < from)
        {
            errors["period"] = ["A data final não pode ser anterior à data inicial."];
        }
        else if (to.DayNumber - from.DayNumber + 1 > 31)
        {
            errors["period"] = ["O período detalhado deve ter no máximo 31 dias."];
        }

        if (page < 1)
        {
            errors["page"] = ["A página deve ser maior que zero."];
        }

        if (pageSize is < 1 or > 100)
        {
            errors["pageSize"] = ["O tamanho da página deve estar entre 1 e 100."];
        }

        ValidateFilter(errors, "plate", plate, 10);
        ValidateFilter(errors, "driverName", driverName, 200);
        ValidateFilter(errors, "categoryName", categoryName, 100);
        ValidateFilter(errors, "vehicleIdentification", vehicleIdentification, 100);
        ValidateFilter(errors, "status", status, 30);

        if (errors.Count > 0)
        {
            return (null, errors);
        }

        var fromLocal = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        var toExclusiveLocal = to.AddDays(1)
            .ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);

        return (new(
            from,
            to,
            TimeZoneInfo.ConvertTimeToUtc(fromLocal, institutionalTimeZone),
            TimeZoneInfo.ConvertTimeToUtc(toExclusiveLocal, institutionalTimeZone),
            Normalize(plate),
            Normalize(driverName),
            Normalize(categoryName),
            Normalize(vehicleIdentification),
            Normalize(status),
            page,
            pageSize), errors);
    }

    private static void ValidateFilter(
        IDictionary<string, string[]> errors,
        string field,
        string? value,
        int maximumLength)
    {
        if (value?.Trim().Length > maximumLength)
        {
            errors[field] = [$"O filtro deve ter no máximo {maximumLength} caracteres."];
        }
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static IReadOnlyDictionary<string, string[]> ValidateStatus<TStatus>(
        string? status,
        IReadOnlyDictionary<string, string[]> currentErrors)
        where TStatus : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(status) ||
            Enum.TryParse<TStatus>(status.Trim(), true, out _))
        {
            return currentErrors;
        }

        var errors = new Dictionary<string, string[]>(currentErrors)
        {
            ["status"] = ["A situação informada não é reconhecida."]
        };
        return errors;
    }
}
