using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.InstitutionalVehicles;

namespace ControleAcessoVeiculos.API.Endpoints;

public static class InstitutionalVehicleCatalogEndpoints
{
    public static IEndpointRouteBuilder MapInstitutionalVehicleCatalogEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/institutional-vehicles")
            .RequireAuthorization(AuthorizationPolicies.ReadInstitutionalVehicleCatalog)
            .WithTags("Institutional vehicles");

        group.MapGet(string.Empty, ListActiveAsync)
            .WithName("ListActiveInstitutionalVehicles");
        group.MapPost(string.Empty, CreateAsync)
            .RequireAuthorization(AuthorizationPolicies.ManageInstitutionalVehicleCatalog)
            .WithName("CreateInstitutionalVehicle");

        return endpoints;
    }

    private static async Task<IResult> ListActiveAsync(
        InstitutionalVehicleCatalogService service,
        CancellationToken cancellationToken)
    {
        var vehicles = await service.ListActiveAsync(cancellationToken);
        return Results.Ok(vehicles);
    }

    private static async Task<IResult> CreateAsync(
        CreateInstitutionalVehicleRequest request,
        HttpContext httpContext,
        InstitutionalVehicleCatalogService service,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.CreateAsync(
            new CreateInstitutionalVehicleCommand(
                request.Plate,
                request.Identification,
                request.VehicleType,
                request.Brand,
                request.Model,
                request.Color,
                request.Year),
            actorUserId,
            cancellationToken);

        return result.Status switch
        {
            CreateInstitutionalVehicleStatus.Success => Results.Created(
                $"/institutional-vehicles/{result.Vehicle!.Id}",
                result.Vehicle),
            CreateInstitutionalVehicleStatus.Conflict => Results.Conflict(new
            {
                Message = "Não foi possível cadastrar o veículo institucional.",
                Errors = result.Errors
            }),
            _ => Results.ValidationProblem(result.Errors)
        };
    }
}

public sealed record CreateInstitutionalVehicleRequest(
    string? Plate,
    string? Identification,
    string? VehicleType = null,
    string? Brand = null,
    string? Model = null,
    string? Color = null,
    int? Year = null);
