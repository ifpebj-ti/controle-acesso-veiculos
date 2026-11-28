using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.API.Endpoints;

public static class AccessCorrectionReviewEndpoints
{
    public static IEndpointRouteBuilder MapAccessCorrectionReviewEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/access-records/{accessRecordId:int}/correction-requests", SubmitAsync)
            .RequireAuthorization(AuthorizationPolicies.CorrectAccessRecords)
            .WithTags("Access correction review")
            .WithName("SubmitAccessCorrectionRequest")
            .WithSummary("Solicita correção descritiva sem alterar o acesso efetivo")
            .Produces<AccessCorrectionRecord>(StatusCodes.Status201Created)
            .Produces<AccessCorrectionRecord>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden)
            .ProducesValidationProblem().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        var group = endpoints.MapGroup("/access-correction-requests")
            .RequireAuthorization(AuthorizationPolicies.ReviewAccessRecords)
            .WithTags("Access correction review");
        group.MapGet(string.Empty, SearchAsync)
            .WithName("SearchAccessCorrectionRequests")
            .WithSummary("Consulta pedidos próprios ou a fila autorizada de revisão")
            .Produces<AccessCorrectionPage>().ProducesValidationProblem()
            .Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden);
        group.MapGet("/{id:int}", GetAsync)
            .WithName("GetAccessCorrectionRequest")
            .WithSummary("Consulta uma solicitação dentro do escopo do usuário")
            .Produces<AccessCorrectionRecord>().Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden);
        group.MapGet("/by-key/{requestKey:guid}", GetByKeyAsync)
            .WithName("GetOwnAccessCorrectionRequestByKey")
            .WithSummary("Reconcilia pedido próprio pela chave, sem reenviar uma mutação")
            .Produces<AccessCorrectionRecord>().Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden);
        group.MapPost("/{id:int}/decision", DecideAsync)
            .RequireAuthorization(AuthorizationPolicies.ReviewAccessCorrections)
            .WithName("DecideAccessCorrectionRequest")
            .WithSummary("Aprova ou rejeita solicitação de outra pessoa com justificativa")
            .Produces<AccessCorrectionRecord>().ProducesValidationProblem()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden).Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);
        group.MapPost("/{id:int}/cancellation", CancelAsync)
            .WithName("CancelAccessCorrectionRequest")
            .WithSummary("Cancela um pedido próprio pendente sem apagar o histórico")
            .Produces<AccessCorrectionRecord>().ProducesValidationProblem()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden).Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);
        return endpoints;
    }

    private static async Task<IResult> SubmitAsync(
        int accessRecordId, SubmitAccessCorrectionCommand request,
        HttpContext context, AccessCorrectionReviewService service, CancellationToken cancellationToken)
    {
        NoStore(context);
        if (!AuthenticatedUser.TryGetId(context.User, out var actorId)) return Results.Unauthorized();
        return ToResult(await service.SubmitAsync(accessRecordId, request, actorId, cancellationToken));
    }

    private static async Task<IResult> SearchAsync(
        HttpContext context, IAccessCorrectionReviewStore store, CancellationToken cancellationToken,
        string? status = null, int page = 1, int pageSize = 25)
    {
        NoStore(context);
        if (!AuthenticatedUser.TryGetId(context.User, out var actorId)) return Results.Unauthorized();
        StatusSolicitacaoCorrecao? parsedStatus = null;
        if (status is not null)
        {
            if (!Enum.TryParse<StatusSolicitacaoCorrecao>(status, false, out var parsed) ||
                !Enum.IsDefined(parsed) || status != parsed.ToString())
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["status"] = ["Informe Pendente, Aprovada, Rejeitada ou Cancelada."]
                });
            parsedStatus = parsed;
        }

        if (page is < 1 or > 1000000 || pageSize is < 1 or > 100)
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["pagination"] = ["Informe página entre 1 e 1000000 e tamanho entre 1 e 100."]
            });

        return Results.Ok(await store.SearchAsync(actorId, CanReview(context), parsedStatus,
            page, pageSize, cancellationToken));
    }

    private static async Task<IResult> GetAsync(
        int id, HttpContext context, IAccessCorrectionReviewStore store, CancellationToken cancellationToken)
    {
        NoStore(context);
        if (!AuthenticatedUser.TryGetId(context.User, out var actorId)) return Results.Unauthorized();
        var result = await store.GetAsync(id, actorId, CanReview(context), cancellationToken);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> DecideAsync(
        int id, AccessCorrectionDecisionRequest request, HttpContext context,
        AccessCorrectionReviewService service, CancellationToken cancellationToken)
    {
        NoStore(context);
        if (!AuthenticatedUser.TryGetId(context.User, out var actorId)) return Results.Unauthorized();
        var decision = request.Decision switch
        {
            "Approve" => StatusSolicitacaoCorrecao.Aprovada,
            "Reject" => StatusSolicitacaoCorrecao.Rejeitada,
            _ => StatusSolicitacaoCorrecao.Pendente
        };
        return ToResult(await service.DecideAsync(id, decision, request.Justification, actorId, cancellationToken));
    }

    private static async Task<IResult> GetByKeyAsync(
        Guid requestKey, HttpContext context, IAccessCorrectionReviewStore store, CancellationToken cancellationToken)
    {
        NoStore(context);
        if (!AuthenticatedUser.TryGetId(context.User, out var actorId)) return Results.Unauthorized();
        var result = await store.GetByKeyAsync(requestKey, actorId, cancellationToken);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> CancelAsync(
        int id, AccessCorrectionCancellationRequest request, HttpContext context,
        AccessCorrectionReviewService service, CancellationToken cancellationToken)
    {
        NoStore(context);
        if (!AuthenticatedUser.TryGetId(context.User, out var actorId)) return Results.Unauthorized();
        return ToResult(await service.DecideAsync(id, StatusSolicitacaoCorrecao.Cancelada,
            request.Justification, actorId, cancellationToken));
    }

    private static bool CanReview(HttpContext context) =>
        context.User.IsInRole(ProfileNames.Administrator) ||
        context.User.IsInRole(ProfileNames.TransportationDepartment);

    private static void NoStore(HttpContext context) => context.Response.Headers.CacheControl = "no-store";

    private static IResult ToResult(AccessCorrectionOperationResult result) => result.Status switch
    {
        AccessCorrectionOperationStatus.Success when result.Created => Results.Created(
            $"/access-correction-requests/{result.Request!.Id}", result.Request),
        AccessCorrectionOperationStatus.Success => Results.Ok(result.Request),
        AccessCorrectionOperationStatus.NotFound => Results.NotFound(),
        AccessCorrectionOperationStatus.Forbidden => Results.Forbid(),
        AccessCorrectionOperationStatus.Invalid => Results.ValidationProblem(
            result.Errors?.ToDictionary(x => x.Key, x => x.Value) ?? []),
        _ => Results.Conflict(new
        {
            Code = "CorrectionRequestConflict",
            Message = "O registro ou a solicitação mudou. Atualize os dados antes de continuar."
        })
    };
}

public sealed record AccessCorrectionDecisionRequest(string Decision, string Justification);
public sealed record AccessCorrectionCancellationRequest(string Justification);
