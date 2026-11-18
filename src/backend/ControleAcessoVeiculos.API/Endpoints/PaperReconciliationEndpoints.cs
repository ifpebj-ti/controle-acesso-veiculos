using System.Globalization;
using System.Security.Claims;
using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Application.Contingency;

namespace ControleAcessoVeiculos.API.Endpoints;

public static class PaperReconciliationEndpoints
{
    public static IEndpointRouteBuilder MapPaperReconciliationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/paper-reconciliation")
            .WithTags("Paper reconciliation").RequireAuthorization(AuthorizationPolicies.OperateAccess);
        group.AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(context);
        });
        group.MapPost("/incidents", RegisterIncidentAsync)
            .RequireAuthorization(AuthorizationPolicies.ManagePaperReconciliation)
            .WithName("RegisterPaperIncident").WithSummary("Registra o período e a referência da folha de contingência")
            .WithDescription("Transporte/Administrador. IncidentId identifica a mesma intenção de cadastro. Datas ISO 8601 com offset explícito.");
        group.MapGet("/incidents", ListIncidentsAsync)
            .WithName("ListPaperIncidents").WithSummary("Lista incidentes para transcrição de papel");
        group.MapPost("/imports", ImportAsync)
            .WithName("ImportPaperAccess").WithSummary("Transcreve uma linha do papel sem substituir seus horários")
            .WithDescription("Perfis de negócio. RequestKey deve ser preservada para reconciliar resposta incerta. Mesma intenção e payload retornam recibo original; payload divergente ou linha duplicada recebem 409.");
        group.MapGet("/imports", SearchAsync)
            .WithName("SearchPaperImports").WithSummary("Consulta a fila de conferência e as próprias transcrições")
            .WithDescription("Operadores consultam suas próprias transcrições; Transporte/Administrador consultam a fila. Status Pendente, Conferida ou Recusada.");
        group.MapPost("/imports/{accessRecordId:int:min(1)}/review", ReviewAsync)
            .RequireAuthorization(AuthorizationPolicies.ManagePaperReconciliation)
            .WithName("ReviewPaperAccess").WithSummary("Confere a transcrição, preservando os fatos e a saída operacional")
            .WithDescription("Outra pessoa autorizada decide com justificativa. Mesma decisão repetida conserva o primeiro instante; decisão divergente recebe 409. Recusa preserva acesso e evidência.");
        return endpoints;
    }

    private static async Task<IResult> RegisterIncidentAsync(PaperIncidentRequest request,
        HttpContext context, PaperIncidentService service, CancellationToken ct)
    {
        if (!AuthenticatedUser.TryGetId(context.User, out var actor)) return Results.Unauthorized();
        if (!TryTime(request.StartedAt, out var start) || !TryTime(request.EndedAt, out var end)) return InvalidTimes();
        var result = await service.RegisterAsync(new(request.IncidentId, request.PaperReference, start, end), actor, ct);
        return result.Status switch
        {
            PaperReconciliationStatus.Success => Results.Ok(result.Incident),
            PaperReconciliationStatus.Invalid => Results.ValidationProblem(result.Errors!.ToDictionary(x => x.Key, x => x.Value)),
            _ => Results.Conflict(new { code = "paper_incident_changed", message = "A chave do incidente já identifica outro cadastro." })
        };
    }

    private static async Task<IResult> ImportAsync(PaperImportRequest request,
        HttpContext context, PaperReconciliationService service, CancellationToken ct)
    {
        if (!AuthenticatedUser.TryGetId(context.User, out var actor)) return Results.Unauthorized();
        if (!TryTime(request.ObservedEntryAt, out var entry)) return InvalidTimes();
        DateTimeOffset? exit = null;
        if (request.ObservedExitAt is not null)
        {
            if (!TryTime(request.ObservedExitAt, out var parsed)) return InvalidTimes();
            exit = parsed;
        }
        return Mutation(await service.ImportAsync(new(request.RequestKey, request.IncidentId, request.LineNumber,
            request.PaperAuthorReference, entry, exit, request.Justification, request.Entry),
            actor, context.User.FindFirstValue(ClaimTypes.Role) ?? "", ct));
    }

    private static async Task<IResult> ReviewAsync(int accessRecordId, ReviewPaperAccessCommand request,
        HttpContext context, PaperReconciliationService service, CancellationToken ct)
    {
        if (!AuthenticatedUser.TryGetId(context.User, out var actor)) return Results.Unauthorized();
        return Mutation(await service.ReviewAsync(accessRecordId, request, actor,
            context.User.FindFirstValue(ClaimTypes.Role) ?? "", ct));
    }

    private static async Task<IResult> ListIncidentsAsync(IPaperReconciliationCatalog catalog,
        int page = 1, int pageSize = 25, CancellationToken ct = default) =>
        ValidPage(page, pageSize) ? Results.Ok(await catalog.ListIncidentsAsync(page, pageSize, ct)) : InvalidPage();

    private static async Task<IResult> SearchAsync(HttpContext context, IPaperReconciliationCatalog catalog,
        string? status = null, int page = 1, int pageSize = 25, CancellationToken ct = default)
    {
        if (!AuthenticatedUser.TryGetId(context.User, out var actor)) return Results.Unauthorized();
        if (!ValidPage(page, pageSize)) return InvalidPage();
        if (status is not (null or "" or "Pendente" or "Conferida" or "Recusada"))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Informe um estado de conferência válido."] });
        int? importer = context.User.IsInRole(ProfileNames.Administrator) || context.User.IsInRole(ProfileNames.TransportationDepartment)
            ? null : actor;
        return Results.Ok(await catalog.SearchAsync(status, importer, page, pageSize, ct));
    }

    private static IResult Mutation(PaperReconciliationResult result) => result.Status switch
    {
        PaperReconciliationStatus.Success => Results.Ok(result.Receipt),
        PaperReconciliationStatus.Invalid => Results.ValidationProblem(result.Errors!.ToDictionary(x => x.Key, x => x.Value)),
        PaperReconciliationStatus.Forbidden => Results.Forbid(),
        PaperReconciliationStatus.NotFound => Results.NotFound(new { code = result.Code ?? "paper_import_not_found" }),
        _ => Results.Conflict(new { code = result.Code ?? "paper_conflict", message = "Confira o incidente, a linha e os registros existentes antes de tentar novamente." })
    };

    private static bool TryTime(string? text, out DateTimeOffset value)
    {
        value = default;
        string[] formats =
        [
            "yyyy-MM-dd'T'HH:mm:ss.FFFFFFFzzz", "yyyy-MM-dd'T'HH:mm:sszzz",
            "yyyy-MM-dd'T'HH:mm:ss.FFFFFFF'Z'", "yyyy-MM-dd'T'HH:mm:ss'Z'"
        ];
        return DateTimeOffset.TryParseExact(text, formats, CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal, out value);
    }
    private static bool ValidPage(int page, int size) => page is >= 1 and <= 100000 && size is >= 1 and <= 100;
    private static IResult InvalidPage() => Results.ValidationProblem(new Dictionary<string, string[]> { ["page"] = ["Informe página entre 1 e 100000 e tamanho entre 1 e 100."] });
    private static IResult InvalidTimes() => Results.ValidationProblem(new Dictionary<string, string[]> { ["observedTime"] = ["Informe datas ISO 8601 com Z ou offset explícito."] });
}

public sealed record PaperIncidentRequest(Guid IncidentId, string PaperReference, string StartedAt, string EndedAt);
public sealed record PaperImportRequest(Guid RequestKey, Guid IncidentId, int LineNumber,
    string PaperAuthorReference, string ObservedEntryAt, string? ObservedExitAt,
    string Justification, RegisterVehicleEntryCommand Entry);
