using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.AccessRecords;

namespace ControleAcessoVeiculos.API.Endpoints;

public static class VehicleAccessEndpoints
{
    public static IEndpointRouteBuilder MapVehicleAccessEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/access-records")
            .RequireAuthorization(AuthorizationPolicies.OperateAccess)
            .WithTags("Vehicle access");

        group.MapPost("/entries", RegisterEntryAsync)
            .WithName("RegisterVehicleEntry");
        group.MapGet("/open", ListOpenAsync)
            .WithName("ListOpenVehicleAccesses");
        group.MapPost("/{accessRecordId:int}/exit", RegisterExitAsync)
            .WithName("RegisterVehicleExit");

        return endpoints;
    }

    private static async Task<IResult> RegisterEntryAsync(
        RegisterVehicleEntryRequest request,
        HttpContext httpContext,
        VehicleAccessService vehicleAccessService,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await vehicleAccessService.RegisterEntryAsync(
            new RegisterVehicleEntryCommand(
                request.DriverName,
                request.Plate,
                request.Objective,
                request.CategoryName,
                request.DocumentType,
                request.DocumentNumber,
                request.VehicleType,
                request.Brand,
                request.Model,
                request.Color,
                request.Year,
                request.Observation),
            actorUserId,
            cancellationToken);

        return result.Status switch
        {
            RegisterVehicleEntryStatus.Success => Results.Created(
                $"/access-records/{result.AccessRecord!.Id}",
                result.AccessRecord),
            RegisterVehicleEntryStatus.Conflict => Results.Conflict(new
            {
                Message = "Não foi possível registrar a entrada.",
                Errors = result.Errors
            }),
            _ => Results.ValidationProblem(result.Errors)
        };
    }

    private static async Task<IResult> ListOpenAsync(
        VehicleAccessService vehicleAccessService,
        CancellationToken cancellationToken)
    {
        var records = await vehicleAccessService.ListOpenAsync(cancellationToken);
        return Results.Ok(records);
    }

    private static async Task<IResult> RegisterExitAsync(
        int accessRecordId,
        HttpContext httpContext,
        VehicleAccessService vehicleAccessService,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await vehicleAccessService.CloseAsync(
            accessRecordId,
            actorUserId,
            cancellationToken);

        return result.Status switch
        {
            CloseVehicleAccessStatus.Success => Results.Ok(result.AccessRecord),
            CloseVehicleAccessStatus.NotFound => Results.NotFound(new
            {
                Message = "Registro de acesso não encontrado."
            }),
            _ => Results.Conflict(new
            {
                Message = "O registro de acesso já foi encerrado."
            })
        };
    }

}

public sealed record RegisterVehicleEntryRequest(
    string DriverName,
    string Plate,
    string Objective,
    string CategoryName,
    string? DocumentType = null,
    string? DocumentNumber = null,
    string? VehicleType = null,
    string? Brand = null,
    string? Model = null,
    string? Color = null,
    int? Year = null,
    string? Observation = null);
