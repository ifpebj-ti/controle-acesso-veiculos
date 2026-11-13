using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.CampusDrivers;

namespace ControleAcessoVeiculos.API.Endpoints;

public static class CampusDriverEndpoints
{
    public static IEndpointRouteBuilder MapCampusDriverEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/campus-drivers").WithTags("Campus driver registry")
            .RequireAuthorization(AuthorizationPolicies.ManageCampusDrivers);
        group.AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(context);
        });
        group.MapPost("", RegisterAsync).WithName("RegisterCampusDriver")
            .WithSummary("Pré-cadastra condutor com vínculo e nascimento conferidos")
            .WithDescription("Somente Transporte/Administrador. Idade mínima 18; não comprova habilitação nem autoriza entrada. Não cria conta de login.");
        group.MapGet("", SearchAsync).WithName("SearchCampusDrivers")
            .WithSummary("Pesquisa pré-cadastros sem expor nascimento ou documentos");
        group.MapPost("/{personId:int:min(1)}/vehicles", AddVehicleAsync).WithName("AddCampusDriverVehicle")
            .WithSummary("Associa outro veículo ao mesmo condutor pré-cadastrado");
        group.MapPost("/{personId:int:min(1)}/deactivate", DeactivateAsync).WithName("DeactivateCampusDriver")
            .WithSummary("Desativa o pré-cadastro sem apagar pessoa, conta ou histórico");
        endpoints.MapGet("/access-records/entry-suggestions", SuggestAsync)
            .RequireAuthorization(AuthorizationPolicies.OperateAccess)
            .WithTags("Vehicle access")
            .WithName("SuggestVehicleEntry")
            .WithSummary("Sugere cadastro vinculado ativo ou visita do operador no dia institucional")
            .WithDescription("Máximo dez itens. Sugestão não autoriza entrada; confirmar pessoa e objetivo. Não devolve nascimento, documentos ou autorização de evento.");
        return endpoints;
    }

    private static async Task<IResult> RegisterAsync(RegisterCampusDriverCommand request,
        HttpContext context, CampusDriverService service, CancellationToken ct)
    {
        if (!AuthenticatedUser.TryGetId(context.User, out var actor)) return Results.Unauthorized();
        return Mutation(await service.RegisterAsync(request, actor, ct));
    }
    private static async Task<IResult> AddVehicleAsync(int personId, AddCampusDriverVehicleCommand request,
        HttpContext context, CampusDriverService service, CancellationToken ct)
    {
        if (!AuthenticatedUser.TryGetId(context.User, out var actor)) return Results.Unauthorized();
        return Mutation(await service.AddVehicleAsync(personId, request, actor, ct));
    }
    private static async Task<IResult> DeactivateAsync(int personId, HttpContext context,
        CampusDriverService service, CancellationToken ct)
    {
        if (!AuthenticatedUser.TryGetId(context.User, out var actor)) return Results.Unauthorized();
        return await service.DeactivateAsync(personId, actor, ct) ? Results.NoContent() : Results.NotFound();
    }
    private static async Task<IResult> SearchAsync(CampusDriverService service,
        string? query = null, int page = 1, int pageSize = 25, bool includeInactive = false,
        CancellationToken ct = default)
    {
        if ((query is not null && (query.Length > 80 || query.Any(char.IsControl))) ||
            page is < 1 or > 100000 || pageSize is < 1 or > 100)
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["query"] = ["Busca inválida; página entre 1 e 100000 e tamanho entre 1 e 100."]
            });
        return Results.Ok(await service.SearchAsync(query, page, pageSize, includeInactive, ct));
    }
    private static async Task<IResult> SuggestAsync(string query, HttpContext context,
        CampusDriverService service, CancellationToken ct)
    {
        context.Response.Headers.CacheControl = "no-store";
        if (!AuthenticatedUser.TryGetId(context.User, out var actor)) return Results.Unauthorized();
        if (query.Trim().Length is < 3 or > 80 || query.Any(char.IsControl))
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["query"] = ["Informe de 3 a 80 caracteres, sem controles."]
            });
        return Results.Ok(await service.SuggestAsync(query, actor, ct));
    }
    private static IResult Mutation(CampusDriverResult result) => result.Status switch
    {
        CampusDriverStatus.Success => Results.Json(result.Item, statusCode: StatusCodes.Status201Created),
        CampusDriverStatus.NotFound => Results.NotFound(),
        CampusDriverStatus.Conflict => Results.Conflict(new { code = "campus_driver_conflict", errors = result.Errors }),
        _ => Results.ValidationProblem(result.Errors.ToDictionary(x => x.Key, x => x.Value))
    };
}
