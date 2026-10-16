using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.AdministrativeReports;

public sealed class AdministrativeReportService(
    IAdministrativeReportStore store,
    IAdministrativeReportExportSecurity exportSecurity,
    IAdministrativeReportPdfRenderer pdfRenderer,
    TimeZoneInfo institutionalTimeZone,
    TimeProvider timeProvider)
{
    private const int MaximumExportRecords = 1000;

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

    public Task<AdministrativeReportExportResult> ExportVehicleMovementsAsync(
        VehicleMovementReportQuery query,
        int actorUserId,
        string? currentPassword,
        CancellationToken cancellationToken) =>
        ExportAsync(
            query.From,
            query.To,
            query.Plate,
            query.DriverName,
            query.CategoryName,
            null,
            query.Status,
            actorUserId,
            currentPassword,
            "VehicleMovements",
            async criteria =>
            {
                var page = await store.SearchVehicleMovementsAsync(
                    criteria,
                    institutionalTimeZone.Id,
                    cancellationToken);
                return (page.TotalCount, (IReadOnlyList<VehicleMovementReportItem>)page.Items);
            },
            (items, totalCount, actorName, filters) =>
            {
                var export = new AdministrativeReportExport<VehicleMovementReportItem>(
                    items,
                    totalCount,
                    query.From,
                    query.To,
                    institutionalTimeZone.Id,
                    timeProvider.GetUtcNow().UtcDateTime,
                    actorName,
                    filters);
                return new GeneratedAdministrativeReport(
                    pdfRenderer.RenderVehicleMovements(export),
                    $"movimentacoes-veiculos-{query.From:yyyy-MM-dd}-a-{query.To:yyyy-MM-dd}.pdf");
            },
            cancellationToken);

    public Task<AdministrativeReportExportResult> ExportInstitutionalFleetAsync(
        InstitutionalFleetReportQuery query,
        int actorUserId,
        string? currentPassword,
        CancellationToken cancellationToken) =>
        ExportAsync(
            query.From,
            query.To,
            query.Plate,
            query.DriverName,
            null,
            query.VehicleIdentification,
            query.Status,
            actorUserId,
            currentPassword,
            "InstitutionalFleet",
            async criteria =>
            {
                var page = await store.SearchInstitutionalFleetAsync(
                    criteria,
                    institutionalTimeZone.Id,
                    cancellationToken);
                return (page.TotalCount, (IReadOnlyList<InstitutionalFleetReportItem>)page.Items);
            },
            (items, totalCount, actorName, filters) =>
            {
                var export = new AdministrativeReportExport<InstitutionalFleetReportItem>(
                    items,
                    totalCount,
                    query.From,
                    query.To,
                    institutionalTimeZone.Id,
                    timeProvider.GetUtcNow().UtcDateTime,
                    actorName,
                    filters);
                return new GeneratedAdministrativeReport(
                    pdfRenderer.RenderInstitutionalFleet(export),
                    $"utilizacoes-frota-{query.From:yyyy-MM-dd}-a-{query.To:yyyy-MM-dd}.pdf");
            },
            cancellationToken);

    private async Task<AdministrativeReportExportResult> ExportAsync<TItem>(
        DateOnly from,
        DateOnly to,
        string? plate,
        string? driverName,
        string? categoryName,
        string? vehicleIdentification,
        string? status,
        int actorUserId,
        string? currentPassword,
        string reportType,
        Func<AdministrativeReportCriteria,
            Task<(int TotalCount, IReadOnlyList<TItem> Items)>> load,
        Func<IReadOnlyList<TItem>, int, string, IReadOnlyDictionary<string, string?>,
            GeneratedAdministrativeReport> render,
        CancellationToken cancellationToken)
    {
        var (criteria, errors) = Validate(
            from,
            to,
            plate,
            driverName,
            categoryName,
            vehicleIdentification,
            status,
            1,
            MaximumExportRecords,
            MaximumExportRecords);

        errors = reportType == "VehicleMovements"
            ? ValidateStatus<StatusRegistroAcesso>(status, errors)
            : ValidateStatus<StatusUsoVeiculoInstitucional>(status, errors);

        if (criteria is null || errors.Count > 0)
        {
            return AdministrativeReportExportResult.Failure(
                AdministrativeReportExportStatus.Invalid,
                errors);
        }

        if (string.IsNullOrWhiteSpace(currentPassword) || currentPassword.Length > 1024)
        {
            return AdministrativeReportExportResult.Failure(
                AdministrativeReportExportStatus.Invalid,
                new Dictionary<string, string[]>
                {
                    ["currentPassword"] = ["A confirmação da senha atual é obrigatória."]
                });
        }

        var confirmation = await exportSecurity.ConfirmLocalPasswordAsync(
            actorUserId,
            currentPassword,
            cancellationToken);
        if (confirmation.Status != AdministrativeReportExportConfirmationStatus.Success ||
            string.IsNullOrWhiteSpace(confirmation.ActorName))
        {
            await store.RecordExportAsync(
                actorUserId,
                reportType,
                from,
                to,
                false,
                cancellationToken);
            return AdministrativeReportExportResult.Failure(
                AdministrativeReportExportStatus.Unauthorized);
        }

        try
        {
            var (totalCount, items) = await load(criteria);
            if (totalCount > MaximumExportRecords)
            {
                await store.RecordExportAsync(
                    actorUserId,
                    reportType,
                    from,
                    to,
                    false,
                    cancellationToken);
                return AdministrativeReportExportResult.Failure(
                    AdministrativeReportExportStatus.TooLarge,
                    new Dictionary<string, string[]>
                    {
                        ["report"] =
                        [$"A exportação deve conter no máximo {MaximumExportRecords} registros. Reduza o período ou aplique filtros."]
                    });
            }

            var filters = new Dictionary<string, string?>
            {
                ["plate"] = Normalize(plate),
                ["driverName"] = Normalize(driverName),
                ["categoryName"] = Normalize(categoryName),
                ["vehicleIdentification"] = Normalize(vehicleIdentification),
                ["status"] = Normalize(status)
            };
            var generated = render(items, totalCount, confirmation.ActorName, filters);
            await store.RecordExportAsync(
                actorUserId,
                reportType,
                from,
                to,
                true,
                cancellationToken);
            return AdministrativeReportExportResult.Success(generated);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            await store.RecordExportAsync(
                actorUserId,
                reportType,
                from,
                to,
                false,
                cancellationToken);
            return AdministrativeReportExportResult.Failure(
                AdministrativeReportExportStatus.GenerationFailed);
        }
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
        int pageSize,
        int maximumPageSize = 100)
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
        else if (to == DateOnly.MaxValue)
        {
            errors["period"] = ["A data final informada está fora do intervalo permitido."];
        }

        if (page < 1)
        {
            errors["page"] = ["A página deve ser maior que zero."];
        }
        else if (page - 1 > int.MaxValue / Math.Max(pageSize, 1))
        {
            errors["page"] = ["A página informada está fora do intervalo permitido."];
        }

        if (pageSize < 1 || pageSize > maximumPageSize)
        {
            errors["pageSize"] =
                [$"O tamanho da página deve estar entre 1 e {maximumPageSize}."];
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
