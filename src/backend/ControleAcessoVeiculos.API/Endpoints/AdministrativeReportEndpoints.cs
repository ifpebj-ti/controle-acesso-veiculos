using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.AdministrativeReports;

namespace ControleAcessoVeiculos.API.Endpoints;

public static class AdministrativeReportEndpoints
{
    public static IEndpointRouteBuilder MapAdministrativeReportEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/reports")
            .RequireAuthorization(AuthorizationPolicies.ReviewAdministrativeReports)
            .WithTags("Administrative reports");

        group.MapGet("/vehicle-movements", SearchVehicleMovementsAsync)
            .WithName("SearchVehicleMovementReport")
            .WithSummary("Consulta o relatório de movimentações de veículos");

        group.MapGet("/institutional-fleet", SearchInstitutionalFleetAsync)
            .WithName("SearchInstitutionalFleetReport")
            .WithSummary("Consulta o relatório de utilizações da frota institucional");

        group.MapPost("/vehicle-movements/pdf", ExportVehicleMovementsAsync)
            .RequireRateLimiting(ApiRateLimiting.PasswordChangePolicy)
            .WithName("ExportVehicleMovementReportPdf")
            .WithSummary("Exporta o relatório de movimentações em PDF");

        group.MapPost("/institutional-fleet/pdf", ExportInstitutionalFleetAsync)
            .RequireRateLimiting(ApiRateLimiting.PasswordChangePolicy)
            .WithName("ExportInstitutionalFleetReportPdf")
            .WithSummary("Exporta o relatório de utilizações da frota em PDF");

        return endpoints;
    }

    private static async Task<IResult> SearchVehicleMovementsAsync(
        [AsParameters] VehicleMovementReportRequest request,
        AdministrativeReportService service,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.SearchVehicleMovementsAsync(
            new(
                request.From,
                request.To,
                request.Plate,
                request.DriverName,
                request.CategoryName,
                request.Status,
                request.Page,
                request.PageSize),
            actorUserId,
            cancellationToken);

        return result.Status == AdministrativeReportStatus.Success
            ? Results.Ok(result.Report)
            : Results.ValidationProblem(result.Errors);
    }

    private static async Task<IResult> SearchInstitutionalFleetAsync(
        [AsParameters] InstitutionalFleetReportRequest request,
        AdministrativeReportService service,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.SearchInstitutionalFleetAsync(
            new(
                request.From,
                request.To,
                request.Plate,
                request.VehicleIdentification,
                request.DriverName,
                request.Status,
                request.Page,
                request.PageSize),
            actorUserId,
            cancellationToken);

        return result.Status == AdministrativeReportStatus.Success
            ? Results.Ok(result.Report)
            : Results.ValidationProblem(result.Errors);
    }

    private static async Task<IResult> ExportVehicleMovementsAsync(
        VehicleMovementReportExportRequest request,
        AdministrativeReportService service,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.ExportVehicleMovementsAsync(
            new(
                request.From,
                request.To,
                request.Plate,
                request.DriverName,
                request.CategoryName,
                request.Status),
            actorUserId,
            request.CurrentPassword,
            cancellationToken);

        return ToExportResult(result, httpContext);
    }

    private static async Task<IResult> ExportInstitutionalFleetAsync(
        InstitutionalFleetReportExportRequest request,
        AdministrativeReportService service,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.ExportInstitutionalFleetAsync(
            new(
                request.From,
                request.To,
                request.Plate,
                request.VehicleIdentification,
                request.DriverName,
                request.Status),
            actorUserId,
            request.CurrentPassword,
            cancellationToken);

        return ToExportResult(result, httpContext);
    }

    private static IResult ToExportResult(
        AdministrativeReportExportResult result,
        HttpContext httpContext)
    {
        if (result.Status == AdministrativeReportExportStatus.Success &&
            result.Report is not null)
        {
            httpContext.Response.Headers.CacheControl = "no-store";
            httpContext.Response.Headers.Pragma = "no-cache";
            return Results.File(
                result.Report.Content,
                "application/pdf",
                result.Report.FileName,
                enableRangeProcessing: false);
        }

        return result.Status switch
        {
            AdministrativeReportExportStatus.Invalid or
                AdministrativeReportExportStatus.TooLarge =>
                Results.ValidationProblem(result.Errors),
            AdministrativeReportExportStatus.Unauthorized => Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Não foi possível confirmar a autorização da exportação."),
            _ => Results.Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Não foi possível gerar o relatório agora.")
        };
    }
}

public sealed record VehicleMovementReportRequest(
    DateOnly From,
    DateOnly To,
    string? Plate = null,
    string? DriverName = null,
    string? CategoryName = null,
    string? Status = null,
    int Page = 1,
    int PageSize = 25);

public sealed record InstitutionalFleetReportRequest(
    DateOnly From,
    DateOnly To,
    string? Plate = null,
    string? VehicleIdentification = null,
    string? DriverName = null,
    string? Status = null,
    int Page = 1,
    int PageSize = 25);

public sealed record VehicleMovementReportExportRequest(
    DateOnly From,
    DateOnly To,
    string CurrentPassword,
    string? Plate = null,
    string? DriverName = null,
    string? CategoryName = null,
    string? Status = null);

public sealed record InstitutionalFleetReportExportRequest(
    DateOnly From,
    DateOnly To,
    string CurrentPassword,
    string? Plate = null,
    string? VehicleIdentification = null,
    string? DriverName = null,
    string? Status = null);
