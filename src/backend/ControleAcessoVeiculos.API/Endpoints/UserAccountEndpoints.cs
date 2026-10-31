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
            .WithName("SearchUsers")
            .WithSummary("Consulta contas de usuário")
            .Produces<UserAccountPageResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest);
        group.MapPost(string.Empty, CreateAsync)
            .WithName("CreateUser")
            .WithSummary("Cria uma conta com credencial temporária");
        group.MapDelete("/{id:int}", DeactivateAsync)
            .WithName("DeactivateUser")
            .WithSummary("Desativa uma conta de usuário");
        group.MapPost("/{id:int}/reactivation", ReactivateAsync)
            .WithName("ReactivateUser")
            .WithSummary("Reativa uma conta de usuário");
        group.MapPost("/{id:int}/temporary-credential", ResetCredentialAsync)
            .RequireRateLimiting(ApiRateLimiting.PasswordChangePolicy)
            .WithName("ResetUserCredential")
            .WithSummary("Emite uma nova credencial temporária para a conta")
            .Produces<TemporaryCredentialResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status429TooManyRequests);
        group.MapPut("/{id:int}/profile", ChangeProfileAsync)
            .WithName("ChangeUserProfile")
            .WithSummary("Altera o perfil e a fronteira de autenticação da conta")
            .Produces<ChangeUserProfileResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

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

        if (result.Status != SearchUserAccountsStatus.Success)
        {
            return Results.ValidationProblem(result.Errors);
        }

        var page = result.Result!;
        return Results.Ok(new UserAccountPageResponse(
            page.Items.Select(account => new UserAccountResponse(
                account.Id,
                account.Name,
                account.Email,
                account.ProfileName,
                account.Active,
                account.CreatedAtUtc,
                account.UpdatedAtUtc,
                account.LockedUntilUtc,
                account.RequiresPasswordChange,
                account.TemporaryCredentialExpiresAtUtc,
                account.AuthenticationMethod.ToString(),
                account.ExternalIdentityLinked)).ToArray(),
            page.Page,
            page.PageSize,
            page.TotalCount,
            page.TotalPages));
    }

    private static async Task<IResult> CreateAsync(
        CreateUserRequest request,
        HttpContext httpContext,
        CreateUserAccountService service,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.CreateAsync(
            new CreateUserAccountCommand(
                request.Name,
                request.Email,
                request.Password,
                request.ProfileName),
            actorUserId,
            cancellationToken);

        if (result.Status == CreateUserAccountStatus.Success)
        {
            httpContext.Response.Headers.CacheControl = "no-store";
            httpContext.Response.Headers.Pragma = "no-cache";
            return Results.Created(
                $"/users/{result.UserId}",
                new CreateUserResponse(
                    result.UserId!.Value,
                    result.Email!,
                    result.ProfileName!,
                    result.AuthenticationMethod!.Value.ToString(),
                    result.TemporaryCredential,
                    result.TemporaryCredentialExpiresAtUtc));
        }

        return result.Status switch
        {
            CreateUserAccountStatus.Conflict => Results.Conflict(new
            {
                Message = "Não foi possível criar a conta.",
                Errors = result.Errors
            }),
            _ => Results.ValidationProblem(result.Errors)
        };
    }

    private static async Task<IResult> ResetCredentialAsync(
        int id,
        AdministrativeCredentialResetRequest request,
        HttpContext httpContext,
        AdministrativeCredentialResetService service,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.ResetAsync(
            id,
            actorUserId,
            request.Reason,
            cancellationToken);

        if (result.Status == AdministrativeCredentialResetStatus.Success)
        {
            httpContext.Response.Headers.CacheControl = "no-store";
            httpContext.Response.Headers.Pragma = "no-cache";
            return Results.Ok(new TemporaryCredentialResponse(
                result.TemporaryCredential!,
                result.TemporaryCredentialExpiresAtUtc!.Value));
        }

        return result.Status switch
        {
            AdministrativeCredentialResetStatus.NotFound => Results.NotFound(new
            {
                Message = "Conta de usuário não encontrada."
            }),
            AdministrativeCredentialResetStatus.Inactive => Results.Conflict(new
            {
                Message = "Reative a conta antes de redefinir sua credencial."
            }),
            AdministrativeCredentialResetStatus.SelfReset => Results.Conflict(new
            {
                Message = "Use a troca autenticada para alterar a própria senha."
            }),
            AdministrativeCredentialResetStatus.ExternalAuthentication =>
                Results.Conflict(new
                {
                    Message = "A conta vinculada ao Google não utiliza credencial local."
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

    private static async Task<IResult> ChangeProfileAsync(
        int id,
        ChangeUserProfileRequest request,
        HttpContext httpContext,
        ChangeAccountProfileService service,
        CancellationToken cancellationToken)
    {
        if (!AuthenticatedUser.TryGetId(httpContext.User, out var actorUserId))
        {
            return Results.Unauthorized();
        }

        var result = await service.ChangeAsync(
            id,
            actorUserId,
            request.ProfileName,
            request.Reason,
            cancellationToken);

        if (result.Status == ChangeAccountProfileStatus.Success)
        {
            httpContext.Response.Headers.CacheControl = "no-store";
            httpContext.Response.Headers.Pragma = "no-cache";
            return Results.Ok(new ChangeUserProfileResponse(
                result.PreviousProfileName!,
                result.CurrentProfileName!,
                result.AuthenticationMethod!.Value.ToString(),
                result.TemporaryCredential,
                result.TemporaryCredentialExpiresAtUtc));
        }

        return result.Status switch
        {
            ChangeAccountProfileStatus.NotFound => Results.NotFound(new
            {
                Message = "Conta de usuário não encontrada."
            }),
            ChangeAccountProfileStatus.Inactive => Results.Conflict(new
            {
                Message = "Reative a conta antes de alterar seu perfil."
            }),
            ChangeAccountProfileStatus.SelfChange => Results.Conflict(new
            {
                Message = "Um administrador não pode alterar o próprio perfil."
            }),
            ChangeAccountProfileStatus.ProfileNotFound => Results.Conflict(new
            {
                Message = "O perfil solicitado não está ativo no sistema."
            }),
            ChangeAccountProfileStatus.LastAdministrator => Results.Conflict(new
            {
                Message = "A operação deixaria o sistema sem administrador ativo."
            }),
            ChangeAccountProfileStatus.Conflict => Results.Conflict(new
            {
                Message = "A conta já possui o perfil solicitado."
            }),
            _ => Results.ValidationProblem(result.Errors)
        };
    }

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

public sealed record UserAccountResponse(
    int Id,
    string Name,
    string Email,
    string ProfileName,
    bool Active,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    DateTime? LockedUntilUtc,
    bool RequiresPasswordChange,
    DateTime? TemporaryCredentialExpiresAtUtc,
    string AuthenticationMethod,
    bool ExternalIdentityLinked);

public sealed record UserAccountPageResponse(
    IReadOnlyList<UserAccountResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public sealed record SearchUserAccountsRequest(
    string? Search = null,
    bool? Active = null,
    int Page = 1,
    int PageSize = 25);

public sealed record CreateUserRequest(
    string Name,
    string Email,
    string? Password,
    string ProfileName);

public sealed record CreateUserResponse(
    int Id,
    string Email,
    string ProfileName,
    string AuthenticationMethod,
    string? TemporaryCredential,
    DateTime? TemporaryCredentialExpiresAtUtc);

public sealed record AdministrativeCredentialResetRequest(string Reason);

public sealed record ChangeUserProfileRequest(string ProfileName, string Reason);

public sealed record ChangeUserProfileResponse(
    string PreviousProfileName,
    string CurrentProfileName,
    string AuthenticationMethod,
    string? TemporaryCredential,
    DateTime? TemporaryCredentialExpiresAtUtc);

public sealed record TemporaryCredentialResponse(
    string TemporaryCredential,
    DateTime TemporaryCredentialExpiresAtUtc);
