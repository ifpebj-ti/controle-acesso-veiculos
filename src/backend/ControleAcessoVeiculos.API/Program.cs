using ControleAcessoVeiculos.API.Health;
using ControleAcessoVeiculos.API.Endpoints;
using ControleAcessoVeiculos.API.Middleware;
using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.AccessRecords;
using ControleAcessoVeiculos.Application.Accounts;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Application.InstitutionalVehicleUsages;
using ControleAcessoVeiculos.Application.InstitutionalVehicles;
using ControleAcessoVeiculos.Application.InstitutionalDrivers;
using ControleAcessoVeiculos.Infrastructure.Authentication;
using ControleAcessoVeiculos.Infrastructure.AccessRecords;
using ControleAcessoVeiculos.Infrastructure.Data;
using ControleAcessoVeiculos.Infrastructure.InstitutionalVehicleUsages;
using ControleAcessoVeiculos.Infrastructure.InstitutionalVehicles;
using ControleAcessoVeiculos.Infrastructure.InstitutionalDrivers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using System.Diagnostics;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["correlationId"] =
            RequestSafetyMiddleware.GetCorrelationId(context.HttpContext);
        context.ProblemDetails.Extensions["traceId"] =
            Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;
    };
});
builder.WebHost.ConfigureKestrel(options =>
    options.Limits.MaxRequestBodySize = RequestSafetyMiddleware.MaximumRequestBodySize);

var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>() ?? new JwtOptions();
jwtOptions.Validate();
builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(JwtOptions.SectionName));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = "email",
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build())
    .AddPolicy(AuthorizationPolicies.OperateAccess, policy => policy.RequireRole(
        ProfileNames.Doorman,
        ProfileNames.SecurityGuard,
        ProfileNames.Administrator))
    .AddPolicy(AuthorizationPolicies.ReviewAccessRecords, policy => policy.RequireRole(
        ProfileNames.Doorman,
        ProfileNames.SecurityGuard,
        ProfileNames.Administrator))
    .AddPolicy(AuthorizationPolicies.ReviewTransportationRecords, policy => policy.RequireRole(
        ProfileNames.TransportationDepartment,
        ProfileNames.Administrator))
    .AddPolicy(AuthorizationPolicies.ReadInstitutionalVehicleCatalog, policy => policy.RequireRole(
        ProfileNames.Doorman,
        ProfileNames.SecurityGuard,
        ProfileNames.TransportationDepartment,
        ProfileNames.Administrator))
    .AddPolicy(AuthorizationPolicies.ManageInstitutionalVehicleCatalog, policy => policy.RequireRole(
        ProfileNames.TransportationDepartment,
        ProfileNames.Administrator))
    .AddPolicy(AuthorizationPolicies.ReadInstitutionalDrivers, policy => policy.RequireRole(
        ProfileNames.Doorman,
        ProfileNames.SecurityGuard,
        ProfileNames.TransportationDepartment,
        ProfileNames.Administrator))
    .AddPolicy(AuthorizationPolicies.ManageInstitutionalDrivers, policy => policy.RequireRole(
        ProfileNames.TransportationDepartment,
        ProfileNames.Administrator))
    .AddPolicy(AuthorizationPolicies.ManageUsers, policy => policy.RequireRole(
        ProfileNames.Administrator));

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IPasswordHashService, AspNetPasswordHashService>();
builder.Services.AddScoped<IAuthenticationUserStore, AuthenticationUserStore>();
builder.Services.AddScoped<IUserAccountStore, UserAccountStore>();
builder.Services.AddScoped<IVehicleAccessStore, VehicleAccessStore>();
builder.Services.AddScoped<IInstitutionalVehicleUsageStore, InstitutionalVehicleUsageStore>();
builder.Services.AddScoped<IInstitutionalVehicleCatalogStore, InstitutionalVehicleCatalogStore>();
builder.Services.AddScoped<IInstitutionalDriverStore, InstitutionalDriverStore>();
builder.Services.AddScoped<IAccessTokenService, JwtAccessTokenService>();
builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<CreateUserAccountService>();
builder.Services.AddScoped<BootstrapAdministratorService>();
builder.Services.AddScoped<VehicleAccessService>();
builder.Services.AddScoped<InstitutionalVehicleUsageService>();
builder.Services.AddScoped<InstitutionalVehicleCatalogService>();
builder.Services.AddScoped<InstitutionalDriverService>();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? throw new InvalidOperationException(
        "A connection string 'ConnectionStrings:DefaultConnection' não foi configurada.");

builder.Services.AddDbContext<ControleAcessoVeiculosDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddHealthChecks()
    .AddCheck<DatabaseReadinessHealthCheck>(
        "postgresql",
        failureStatus: HealthStatus.Unhealthy,
        tags: ["ready"]);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
}

app.UseMiddleware<RequestSafetyMiddleware>();
app.UseStatusCodePages();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

var livenessOptions = new HealthCheckOptions
{
    Predicate = _ => false,
    ResponseWriter = WriteHealthResponse
};

app.MapHealthChecks("/health", livenessOptions).AllowAnonymous();
app.MapHealthChecks("/health/live", livenessOptions).AllowAnonymous();
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready"),
    ResponseWriter = WriteHealthResponse
}).AllowAnonymous();

app.MapVehicleAccessEndpoints();
app.MapInstitutionalVehicleUsageEndpoints();
app.MapInstitutionalVehicleCatalogEndpoints();
app.MapInstitutionalDriverEndpoints();

app.MapPost("/auth/login", async (
    LoginRequest request,
    LoginService loginService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) ||
        string.IsNullOrWhiteSpace(request.Password) ||
        request.Email.Length > 254 ||
        request.Password.Length > 1024)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["credentials"] = ["E-mail e senha são obrigatórios."]
        });
    }

    var result = await loginService.AuthenticateAsync(
        request.Email,
        request.Password,
        cancellationToken);

    return result.IsSuccess
        ? Results.Ok(new LoginResponse(result.AccessToken!, result.ExpiresAtUtc!.Value))
        : Results.Json(
            new { Message = "Credenciais inválidas." },
            statusCode: StatusCodes.Status401Unauthorized);
})
.AllowAnonymous()
.WithName("Login");

app.MapPost("/users", async (
    CreateUserRequest request,
    CreateUserAccountService createUserAccountService,
    CancellationToken cancellationToken) =>
{
    var result = await createUserAccountService.CreateAsync(
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
})
.RequireAuthorization(AuthorizationPolicies.ManageUsers)
.WithName("CreateUser");

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.RequireAuthorization(AuthorizationPolicies.OperateAccess);

if (args.Contains("--bootstrap-admin", StringComparer.OrdinalIgnoreCase))
{
    await using var scope = app.Services.CreateAsyncScope();
    var bootstrapService = scope.ServiceProvider
        .GetRequiredService<BootstrapAdministratorService>();
    var bootstrapSection = app.Configuration.GetSection("BootstrapAdmin");
    var name = bootstrapSection["Name"];
    var email = bootstrapSection["Email"];
    var password = bootstrapSection["Password"];

    if (string.IsNullOrWhiteSpace(name) ||
        string.IsNullOrWhiteSpace(email) ||
        string.IsNullOrWhiteSpace(password))
    {
        throw new InvalidOperationException(
            "BootstrapAdmin:Name, BootstrapAdmin:Email e BootstrapAdmin:Password são obrigatórios para o provisionamento inicial.");
    }

    var status = await bootstrapService.BootstrapAsync(name, email, password);

    Console.WriteLine(status switch
    {
        BootstrapAdministratorStatus.Success =>
            "Administrador inicial criado. Remova as variáveis BootstrapAdmin do ambiente.",
        BootstrapAdministratorStatus.AlreadyInitialized =>
            "O banco já possui usuários; nenhum administrador foi criado.",
        _ => "Não foi possível criar o administrador inicial. Revise os valores informados."
    });

    return;
}

app.Run();

static Task WriteHealthResponse(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";

    return context.Response.WriteAsJsonAsync(new
    {
        Status = report.Status.ToString(),
        Timestamp = DateTime.UtcNow
    });
}

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

public partial class Program
{
}

public sealed record LoginRequest(string Email, string Password);
public sealed record LoginResponse(string AccessToken, DateTime ExpiresAtUtc);
public sealed record CreateUserRequest(
    string Name,
    string Email,
    string Password,
    string ProfileName);
public sealed record CreateUserResponse(int Id, string Email, string ProfileName);
