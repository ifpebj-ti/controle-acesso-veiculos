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
