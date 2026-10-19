using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.EventAuthorizations;

namespace ControleAcessoVeiculos.API.Endpoints;

public static class EventAuthorizationEndpoints
{
    public static IEndpointRouteBuilder MapEventAuthorizationEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/event-authorizations")
            .RequireAuthorization(AuthorizationPolicies.ReadEventAuthorizations)
            .WithTags("Event authorizations");

        group.MapGet(string.Empty, SearchAsync)
            .WithName("SearchEventAuthorizations")
            .WithSummary("Consulta autorizações de eventos")
            .Produces<PagedEventAuthorizations>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);
        group.MapPost(string.Empty, CreateAsync)
            .RequireAuthorization(AuthorizationPolicies.ManageEventAuthorizations)
            .WithName("CreateEventAuthorization")
            .WithSummary("Cria uma autorização de evento")
            .Produces<EventAuthorizationRecord>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict);
        group.MapPut("/{id:int}", UpdateAsync)
            .RequireAuthorization(AuthorizationPolicies.ManageEventAuthorizations)
            .WithName("UpdateEventAuthorization")
            .WithSummary("Atualiza uma autorização de evento")
            .Produces<EventAuthorizationRecord>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
        group.MapDelete("/{id:int}", CancelAsync)
            .RequireAuthorization(AuthorizationPolicies.ManageEventAuthorizations)
            .WithName("CancelEventAuthorization")
            .WithSummary("Cancela uma autorização de evento")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        return endpoints;
    }

    private static async Task<IResult> SearchAsync(
        [AsParameters] SearchEventAuthorizationsRequest request,
        EventAuthorizationService service,
        CancellationToken cancellationToken)
    {
        var result = await service.SearchAsync(
            new SearchEventAuthorizationsCommand(
                request.FromUtc,
                request.ToUtc,
                request.Name,
                request.Active,
                request.Page,
                request.PageSize),
            cancellationToken);

        return result.Status == EventAuthorizationOperationStatus.Success
            ? Results.Ok(result.Result)
            : Results.ValidationProblem(result.Errors);
    }

    private static async Task<IResult> CreateAsync(
        EventAuthorizationRequest request,
        HttpContext httpContext,
        EventAuthorizationService service,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.CreateAsync(
            ToCreateCommand(request),
            actorUserId,
            cancellationToken);

        return ToMutationResult(result, created: true);
    }

    private static async Task<IResult> UpdateAsync(
        int id,
        EventAuthorizationRequest request,
        HttpContext httpContext,
        EventAuthorizationService service,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.UpdateAsync(
            id,
            new UpdateEventAuthorizationCommand(
                request.Name,
                request.Responsible,
                request.ResponsibleContact,
                request.StartsAtUtc,
                request.EndsAtUtc,
                request.Area,
                request.OvernightAllowed,
                request.ParkingLocation,
                request.VehicleRules?.Select(ToInput).ToArray(),
                request.Notes),
            actorUserId,
            cancellationToken);

        return ToMutationResult(result, created: false);
    }

    private static async Task<IResult> CancelAsync(
        int id,
        HttpContext httpContext,
        EventAuthorizationService service,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.CancelAsync(
            id,
            actorUserId,
            cancellationToken);

        return result.Status switch
        {
            EventAuthorizationOperationStatus.Success => Results.NoContent(),
            EventAuthorizationOperationStatus.Invalid => Results.ValidationProblem(result.Errors),
            EventAuthorizationOperationStatus.NotFound => Results.NotFound(new
            {
                Message = "Autorização de evento não encontrada."
            }),
            _ => Results.Conflict(new
            {
                Message = "A autorização de evento já está cancelada."
            })
        };
    }

    private static IResult ToMutationResult(
        EventAuthorizationOperationResult result,
        bool created) =>
        result.Status switch
        {
            EventAuthorizationOperationStatus.Success when created => Results.Created(
                $"/event-authorizations/{result.Event!.Id}",
                result.Event),
            EventAuthorizationOperationStatus.Success => Results.Ok(result.Event),
            EventAuthorizationOperationStatus.Invalid => Results.ValidationProblem(result.Errors),
            EventAuthorizationOperationStatus.NotFound => Results.NotFound(new
            {
                Message = "Autorização de evento não encontrada."
            }),
            _ => Results.Conflict(new
            {
                Message = "Não foi possível salvar a autorização de evento."
            })
        };

    private static CreateEventAuthorizationCommand ToCreateCommand(
        EventAuthorizationRequest request) =>
        new(
            request.Name,
            request.Responsible,
            request.ResponsibleContact,
            request.StartsAtUtc,
            request.EndsAtUtc,
            request.Area,
            request.OvernightAllowed,
            request.ParkingLocation,
            request.VehicleRules?.Select(ToInput).ToArray(),
            request.Notes);

    private static EventVehicleRuleInput ToInput(EventVehicleRuleRequest request) =>
        new(request.VehicleType, request.Quantity, request.Plate);
}

public sealed record SearchEventAuthorizationsRequest(
    DateTimeOffset? FromUtc = null,
    DateTimeOffset? ToUtc = null,
    string? Name = null,
    bool? Active = true,
    int Page = 1,
    int PageSize = 25);

public sealed record EventAuthorizationRequest(
    string? Name,
    string? Responsible,
    string? ResponsibleContact,
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    string? Area,
    bool OvernightAllowed,
    string? ParkingLocation,
    IReadOnlyList<EventVehicleRuleRequest>? VehicleRules,
    string? Notes = null);

public sealed record EventVehicleRuleRequest(
    string? VehicleType,
    int Quantity,
    string? Plate = null);
