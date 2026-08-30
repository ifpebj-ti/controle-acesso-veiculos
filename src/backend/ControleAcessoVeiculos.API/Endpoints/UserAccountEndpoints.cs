using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.Accounts;

namespace ControleAcessoVeiculos.API.Endpoints;

public static class UserAccountEndpoints
{
    public static IEndpointRouteBuilder MapUserAccountEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/users")
            .RequireAuthorization(AuthorizationPolicies.ManageUsers)
            .WithTags("Users");

        group.MapGet(string.Empty, SearchAsync)
            .WithName("SearchUsers");
        group.MapPost(string.Empty, CreateAsync)
            .WithName("CreateUser");
        group.MapDelete("/{id:int}", DeactivateAsync)
            .WithName("DeactivateUser");
        group.MapPost("/{id:int}/reactivation", ReactivateAsync)
            .WithName("ReactivateUser");

        return endpoints;
    }

    private static async Task<IResult> SearchAsync(
        [AsParameters] SearchUserAccountsRequest request,
        UserAccountLifecycleService service,
        CancellationToken cancellationToken)
    {
        var result = await service.SearchAsync(
            new SearchUserAccountsCommand(
                request.Search,
                request.Active,
                request.Page,
                request.PageSize),
            cancellationToken);

        return result.Status == SearchUserAccountsStatus.Success
            ? Results.Ok(result.Result)
            : Results.ValidationProblem(result.Errors);
    }

    private static async Task<IResult> CreateAsync(
        CreateUserRequest request,
        CreateUserAccountService service,
        CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(
            new CreateUserAccountCommand(
                request.Name,
                request.Email,
                request.Password,
                request.ProfileName),
            cancellationToken);

        return result.Status switch
        {
            CreateUserAccountStatus.Success => Results.Created(
                $"/users/{result.UserId}",
                new CreateUserResponse(
                    result.UserId!.Value,
                    result.Email!,
                    result.ProfileName!)),
            CreateUserAccountStatus.Conflict => Results.Conflict(new
            {
                Message = "Não foi possível criar a conta.",
                Errors = result.Errors
            }),
            _ => Results.ValidationProblem(result.Errors)
        };
    }

    private static Task<IResult> DeactivateAsync(
        int id,
        HttpContext httpContext,
        UserAccountLifecycleService service,
        CancellationToken cancellationToken) =>
        ChangeStateAsync(id, reactivate: false, httpContext, service, cancellationToken);

    private static Task<IResult> ReactivateAsync(
        int id,
        HttpContext httpContext,
        UserAccountLifecycleService service,
        CancellationToken cancellationToken) =>
        ChangeStateAsync(id, reactivate: true, httpContext, service, cancellationToken);

    private static async Task<IResult> ChangeStateAsync(
        int id,
        bool reactivate,
        HttpContext httpContext,
        UserAccountLifecycleService service,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = reactivate
            ? await service.ReactivateAsync(id, actorUserId, cancellationToken)
            : await service.DeactivateAsync(id, actorUserId, cancellationToken);

        return result.Status switch
        {
            ChangeUserAccountStateStatus.Success => Results.NoContent(),
            ChangeUserAccountStateStatus.NotFound => Results.NotFound(new
            {
                Message = "Conta de usuário não encontrada."
            }),
            ChangeUserAccountStateStatus.SelfDeactivation => Results.Conflict(new
            {
                Message = "Um administrador não pode desativar a própria conta.",
                Errors = result.Errors
            }),
            ChangeUserAccountStateStatus.LastAdministrator => Results.Conflict(new
            {
                Message = "A operação deixaria o sistema sem administrador ativo."
            }),
            ChangeUserAccountStateStatus.Conflict => Results.Conflict(new
            {
                Message = reactivate
                    ? "A conta de usuário já está ativa."
                    : "A conta de usuário já está inativa."
            }),
            _ => Results.ValidationProblem(result.Errors)
        };
    }
}

public sealed record SearchUserAccountsRequest(
    string? Search = null,
    bool? Active = null,
    int Page = 1,
    int PageSize = 25);

public sealed record CreateUserRequest(
    string Name,
    string Email,
    string Password,
    string ProfileName);

public sealed record CreateUserResponse(int Id, string Email, string ProfileName);
