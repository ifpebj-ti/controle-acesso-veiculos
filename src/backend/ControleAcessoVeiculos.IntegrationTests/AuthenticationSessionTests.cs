using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class AuthenticationSessionTests(ApiFactory factory)
{
    [Theory]
    [InlineData("missing")]
    [InlineData("malformed")]
    [InlineData("empty")]
    [InlineData("unknown")]
    [InlineData("other-user")]
    [InlineData("expired")]
    [InlineData("idle")]
    public async Task AccessTokenRequiresLiveOwnedSessionFamily(string scenario)
    {
        const string password = "Test-only-password-123!";
        var ct = TestContext.Current.CancellationToken;
        var email = await CreateUserAsync(password, operational: true);
        using var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/auth/login", new { email, password }, ct);
        login.EnsureSuccessStatusCode();
        var body = await login.Content.ReadFromJsonAsync<LoginResponse>(cancellationToken: ct);
        Assert.NotNull(body);
        Assert.Equal(HttpStatusCode.OK, await ReadProtectedAsync(client, body.AccessToken));
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(body.AccessToken);
        var family = Guid.Parse(token.Claims.Single(claim => claim.Type == "sid").Value);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var sid = scenario switch
        {
            "missing" => null,
            "malformed" => "not-a-guid",
            "empty" => Guid.Empty.ToString("D"),
            "unknown" => Guid.NewGuid().ToString("D"),
            _ => family.ToString("D")
        };

        if (scenario == "other-user")
        {
            var otherEmail = await CreateUserAsync(password, operational: true);
            using var otherClient = factory.CreateClient();
            var otherLogin = await otherClient.PostAsJsonAsync("/auth/login", new { email = otherEmail, password }, ct);
            otherLogin.EnsureSuccessStatusCode();
            var otherBody = await otherLogin.Content.ReadFromJsonAsync<LoginResponse>(cancellationToken: ct);
            Assert.NotNull(otherBody);
            sid = handler.ReadJwtToken(otherBody.AccessToken).Claims.Single(claim => claim.Type == "sid").Value;
        }
        else if (scenario == "expired")
        {
            await db.SessoesAutenticacao.Where(session => session.FamiliaId == family)
                .ExecuteUpdateAsync(update => update.SetProperty(session => session.CriadaEm, DateTime.UtcNow.AddDays(-1)).SetProperty(session => session.ExpiraEm, DateTime.UtcNow.AddSeconds(-1)), ct);
        }
        else if (scenario == "idle")
        {
            await db.SessoesAutenticacao.Where(session => session.FamiliaId == family)
                .ExecuteUpdateAsync(update => update.SetProperty(session => session.UltimaAtividadeEm, DateTime.UtcNow.AddHours(-1)), ct);
        }

        var claims = token.Claims.Where(claim => claim.Type != "sid").ToList();
        if (sid is not null)
            claims.Add(new Claim("sid", sid));
        var options = scope.ServiceProvider.GetRequiredService<IOptions<JwtOptions>>().Value;
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.SigningKey));
        var forged = new JwtSecurityToken(
            token.Issuer, token.Audiences.Single(), claims, token.ValidFrom, token.ValidTo,
            new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));
        Assert.Equal(HttpStatusCode.Unauthorized, await ReadProtectedAsync(client, handler.WriteToken(forged)));
    }

    [Fact]
    public async Task LoginPublishesConfirmedSessionDeadlinesWithoutChangingBodyContract()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(password);
        using var client = factory.CreateClient();
        var requestedAtUtc = DateTime.UtcNow;

        var login = await client.PostAsJsonAsync("/auth/login", new { email, password }, cancellationToken: TestContext.Current.CancellationToken);

        login.EnsureSuccessStatusCode();
        var completedAtUtc = DateTime.UtcNow;
        var body = await login.Content.ReadFromJsonAsync<LoginResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.AccessToken));

        var inactivityDeadline = ReadUtcHeader(
            login,
            "X-Session-Inactivity-Expires-At");
        var serverTime = ReadUtcHeader(login, "X-Session-Server-Time");
        var absoluteDeadline = ReadUtcHeader(
            login,
            "X-Session-Absolute-Expires-At");

        Assert.InRange(
            serverTime,
            requestedAtUtc,
            completedAtUtc);
        Assert.Equal(
            TimeSpan.FromMinutes(15),
            inactivityDeadline - serverTime);
        Assert.InRange(
            inactivityDeadline,
            requestedAtUtc.AddMinutes(15),
            completedAtUtc.AddMinutes(15));
        Assert.InRange(
            absoluteDeadline,
            requestedAtUtc.AddHours(12),
            completedAtUtc.AddHours(12));
        Assert.True(inactivityDeadline < absoluteDeadline);
    }

    [Fact]
    public async Task RefreshRequiresValidAntiforgeryToken()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(password);
        using var client = factory.CreateClient();

        var login = await client.PostAsJsonAsync("/auth/login", new { email, password }, cancellationToken: TestContext.Current.CancellationToken);
        login.EnsureSuccessStatusCode();

        var response = await client.PostAsync("/auth/refresh", content: null, cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RefreshRotatesTokenAndReplayedTokenRevokesFamily()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(password, operational: true);
        var userId = await GetUserIdAsync(email);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });

        var csrfResponse = await client.GetAsync("/auth/csrf", TestContext.Current.CancellationToken);
        csrfResponse.EnsureSuccessStatusCode();
        var csrf = await csrfResponse.Content.ReadFromJsonAsync<CsrfResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(csrf);
        var csrfCookie = GetCookie(csrfResponse, "cav_csrf");

        var login = await client.PostAsJsonAsync("/auth/login", new { email, password }, cancellationToken: TestContext.Current.CancellationToken);
        login.EnsureSuccessStatusCode();
        var originalAccess = await login.Content.ReadFromJsonAsync<LoginResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(originalAccess);
        using var independentClient = factory.CreateClient();
        var independentLogin = await independentClient.PostAsJsonAsync("/auth/login", new { email, password }, cancellationToken: TestContext.Current.CancellationToken);
        independentLogin.EnsureSuccessStatusCode();
        var independentAccess = await independentLogin.Content.ReadFromJsonAsync<LoginResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(independentAccess);
        var firstRefreshToken = GetCookie(login, "cav_refresh");
        var absoluteDeadline = ReadUtcHeader(
            login,
            "X-Session-Absolute-Expires-At");
        var refreshRequestedAtUtc = DateTime.UtcNow;

        var firstRefresh = await SendSessionRequestAsync(
            client,
            "/auth/refresh",
            csrf.RequestToken,
            csrfCookie,
            firstRefreshToken);
        firstRefresh.EnsureSuccessStatusCode();
        var refreshCompletedAtUtc = DateTime.UtcNow;
        var refreshedLogin = await firstRefresh.Content.ReadFromJsonAsync<LoginResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(refreshedLogin);
        Assert.False(string.IsNullOrWhiteSpace(refreshedLogin.AccessToken));
        Assert.Equal(
            absoluteDeadline,
            ReadUtcHeader(firstRefresh, "X-Session-Absolute-Expires-At"),
            TimeSpan.FromMicroseconds(1));
        Assert.InRange(
            ReadUtcHeader(firstRefresh, "X-Session-Inactivity-Expires-At"),
            refreshRequestedAtUtc.AddMinutes(15),
            refreshCompletedAtUtc.AddMinutes(15));
        Assert.InRange(
            ReadUtcHeader(firstRefresh, "X-Session-Server-Time"),
            refreshRequestedAtUtc,
            refreshCompletedAtUtc);
        var secondRefreshToken = GetCookie(firstRefresh, "cav_refresh");
        Assert.NotEqual(firstRefreshToken, secondRefreshToken);
        Assert.Equal(HttpStatusCode.OK, await ReadProtectedAsync(client, originalAccess.AccessToken));
        Assert.Equal(HttpStatusCode.OK, await ReadProtectedAsync(client, refreshedLogin.AccessToken));

        var replay = await SendSessionRequestAsync(
            client,
            "/auth/refresh",
            csrf.RequestToken,
            csrfCookie,
            firstRefreshToken);
        Assert.Equal(HttpStatusCode.Unauthorized, replay.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, await ReadProtectedAsync(client, originalAccess.AccessToken));
        Assert.Equal(HttpStatusCode.Unauthorized, await ReadProtectedAsync(client, refreshedLogin.AccessToken));
        Assert.Equal(HttpStatusCode.OK, await ReadProtectedAsync(independentClient, independentAccess.AccessToken));

        var successorAfterReplay = await SendSessionRequestAsync(
            client,
            "/auth/refresh",
            csrf.RequestToken,
            csrfCookie,
            secondRefreshToken);
        Assert.Equal(HttpStatusCode.Unauthorized, successorAfterReplay.StatusCode);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var originalFamilyId = Guid.Parse(new JwtSecurityTokenHandler()
            .ReadJwtToken(originalAccess.AccessToken).Claims.Single(claim => claim.Type == "sid").Value);
        var sessions = await dbContext.SessoesAutenticacao
            .AsNoTracking()
            .Where(item => item.UsuarioId == userId && item.FamiliaId == originalFamilyId)
            .OrderBy(item => item.CriadaEm)
            .ToListAsync(cancellationToken: TestContext.Current.CancellationToken);

        Assert.Equal(2, sessions.Count);
        Assert.All(sessions, session => Assert.NotNull(session.RevogadaEm));
        Assert.Contains(sessions, session =>
            session.MotivoRevogacao == MotivoRevogacaoSessao.ReutilizacaoDetectada);
        Assert.Contains(
            await dbContext.Auditorias.AsNoTracking().ToListAsync(cancellationToken: TestContext.Current.CancellationToken),
            audit => audit.RegistroId == userId &&
                audit.DadosNovos!.Contains(
                    AuthenticationAuditOutcome.TokenReuseDetected.ToString(),
                    StringComparison.Ordinal));
    }

    [Fact]
    public async Task LogoutRevokesSessionFamilyAndExpiresCookie()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(password, operational: true);
        var userId = await GetUserIdAsync(email);
        using var client = factory.CreateClient();

        var csrfResponse = await client.GetAsync("/auth/csrf", TestContext.Current.CancellationToken);
        csrfResponse.EnsureSuccessStatusCode();
        var csrf = await csrfResponse.Content.ReadFromJsonAsync<CsrfResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(csrf);

        var login = await client.PostAsJsonAsync("/auth/login", new { email, password }, cancellationToken: TestContext.Current.CancellationToken);
        login.EnsureSuccessStatusCode();
        var originalAccess = await login.Content.ReadFromJsonAsync<LoginResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(originalAccess);
        Assert.Equal(HttpStatusCode.OK, await ReadProtectedAsync(client, originalAccess.AccessToken));
        using var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/auth/logout");
        logoutRequest.Headers.Add("X-CSRF-TOKEN", csrf.RequestToken);

        var logout = await client.SendAsync(logoutRequest, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, await ReadProtectedAsync(client, originalAccess.AccessToken));
        var deletedCookie = Assert.Single(
            logout.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith("cav_refresh=", StringComparison.Ordinal));
        Assert.Contains("expires=", deletedCookie, StringComparison.OrdinalIgnoreCase);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var session = await dbContext.SessoesAutenticacao
            .AsNoTracking()
            .SingleAsync(item => item.UsuarioId == userId, cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(session.RevogadaEm);
        Assert.Equal(MotivoRevogacaoSessao.Logout, session.MotivoRevogacao);

        var audit = await dbContext.Auditorias.AsNoTracking().SingleAsync(item =>
            item.RegistroId == userId && item.TipoAcao == TipoAcaoAuditoria.Logout, cancellationToken: TestContext.Current.CancellationToken);
        Assert.Contains(
            AuthenticationAuditOutcome.LogoutSucceeded.ToString(),
            audit.DadosNovos,
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task InactiveProfileCannotRenewAndRevokesSessionFamily()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(password);
        var userId = await GetUserIdAsync(email);
        using var client = factory.CreateClient();

        var csrfResponse = await client.GetAsync("/auth/csrf", TestContext.Current.CancellationToken);
        csrfResponse.EnsureSuccessStatusCode();
        var csrf = await csrfResponse.Content.ReadFromJsonAsync<CsrfResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(csrf);
        var login = await client.PostAsJsonAsync("/auth/login", new { email, password }, cancellationToken: TestContext.Current.CancellationToken);
        login.EnsureSuccessStatusCode();

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider
                .GetRequiredService<ControleAcessoVeiculosDbContext>();
            var profileId = await dbContext.Usuarios
                .Where(item => item.Id == userId)
                .Select(item => item.PerfilId)
                .SingleAsync(cancellationToken: TestContext.Current.CancellationToken);
            await dbContext.Perfis
                .Where(item => item.Id == profileId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(item => item.Ativo, false), cancellationToken: TestContext.Current.CancellationToken);
        }

        using var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/auth/refresh");
        refreshRequest.Headers.Add("X-CSRF-TOKEN", csrf.RequestToken);
        var refresh = await client.SendAsync(refreshRequest, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);

        using var verificationScope = factory.Services.CreateScope();
        var verificationContext = verificationScope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var session = await verificationContext.SessoesAutenticacao
            .AsNoTracking()
            .SingleAsync(item => item.UsuarioId == userId, cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(session.RevogadaEm);
        Assert.Equal(
            MotivoRevogacaoSessao.ContaDesativada,
            session.MotivoRevogacao);
    }

    [Fact]
    public async Task ConcurrentRefreshDoesNotCreateTwoValidSuccessors()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(password);
        var userId = await GetUserIdAsync(email);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });

        var csrfResponse = await client.GetAsync("/auth/csrf", TestContext.Current.CancellationToken);
        csrfResponse.EnsureSuccessStatusCode();
        var csrf = await csrfResponse.Content.ReadFromJsonAsync<CsrfResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(csrf);
        var csrfCookie = GetCookie(csrfResponse, "cav_csrf");
        var login = await client.PostAsJsonAsync("/auth/login", new { email, password }, cancellationToken: TestContext.Current.CancellationToken);
        login.EnsureSuccessStatusCode();
        var refreshToken = GetCookie(login, "cav_refresh");

        var responses = await Task.WhenAll(
            SendSessionRequestAsync(
                client,
                "/auth/refresh",
                csrf.RequestToken,
                csrfCookie,
                refreshToken),
            SendSessionRequestAsync(
                client,
                "/auth/refresh",
                csrf.RequestToken,
                csrfCookie,
                refreshToken));

        Assert.Equal(1, responses.Count(response => response.StatusCode == HttpStatusCode.OK));
        Assert.Equal(1, responses.Count(response =>
            response.StatusCode == HttpStatusCode.Unauthorized));

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var activeSuccessors = await dbContext.SessoesAutenticacao.CountAsync(item =>
            item.UsuarioId == userId && item.RevogadaEm == null, cancellationToken: TestContext.Current.CancellationToken);
        Assert.Equal(0, activeSuccessors);

        var winningResponse = Assert.Single(responses, response =>
            response.StatusCode == HttpStatusCode.OK);
        using var winningTokenAfterReuse = await SendSessionRequestAsync(
            client,
            "/auth/refresh",
            csrf.RequestToken,
            csrfCookie,
            GetCookie(winningResponse, "cav_refresh"));
        Assert.Equal(HttpStatusCode.Unauthorized, winningTokenAfterReuse.StatusCode);
        foreach (var response in responses)
        {
            response.Dispose();
        }
    }

    [Fact]
    public async Task LostCommittedRefreshResponseRevokesStaleFamilyAndFreshLoginRecovers()
    {
        const string password = "Test-only-password-123!";
        var email = await CreateUserAsync(password);
        var userId = await GetUserIdAsync(email);
        using var transport = new DiscardFirstRefreshResponseHandler(factory.Server.CreateHandler());
        using var client = new HttpClient(transport)
        {
            BaseAddress = new Uri("http://localhost")
        };
        using var csrfResponse = await client.GetAsync("/auth/csrf", TestContext.Current.CancellationToken);
        csrfResponse.EnsureSuccessStatusCode();
        var csrf = await csrfResponse.Content.ReadFromJsonAsync<CsrfResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(csrf);
        var csrfCookie = GetCookie(csrfResponse, "cav_csrf");
        using var login = await client.PostAsJsonAsync("/auth/login", new { email, password }, cancellationToken: TestContext.Current.CancellationToken);
        login.EnsureSuccessStatusCode();
        var originalToken = GetCookie(login, "cav_refresh");

        // The server commits rotation, but this test transport discards the
        // response before HttpClient can observe or apply its Set-Cookie.
        await Assert.ThrowsAsync<HttpRequestException>(() => SendSessionRequestAsync(
            client, "/auth/refresh", csrf.RequestToken, csrfCookie, originalToken));
        Assert.True(transport.ResponseDiscardedAfterSuccess);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
            var committedFamily = await db.SessoesAutenticacao.AsNoTracking()
                .Where(item => item.UsuarioId == userId)
                .ToListAsync(TestContext.Current.CancellationToken);
            Assert.Equal(2, committedFamily.Count);
            Assert.Equal(1, committedFamily.Count(item => item.ConsumidaEm is not null));
            var rotated = Assert.Single(committedFamily, item => item.ConsumidaEm is not null);
            Assert.NotNull(rotated.RevogadaEm);
            Assert.Equal(MotivoRevogacaoSessao.Rotacao, rotated.MotivoRevogacao);
            Assert.Single(committedFamily, item => item.RevogadaEm is null);
        }

        using var staleRetry = await SendSessionRequestAsync(
            client, "/auth/refresh", csrf.RequestToken, csrfCookie, originalToken);
        Assert.Equal(HttpStatusCode.Unauthorized, staleRetry.StatusCode);

        Guid revokedFamily;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
            var sessions = await db.SessoesAutenticacao.AsNoTracking()
                .Where(item => item.UsuarioId == userId)
                .ToListAsync(TestContext.Current.CancellationToken);
            revokedFamily = Assert.Single(sessions.Select(item => item.FamiliaId).Distinct());
            Assert.All(sessions, item => Assert.NotNull(item.RevogadaEm));
            Assert.Contains(sessions, item => item.MotivoRevogacao == MotivoRevogacaoSessao.Rotacao);
            Assert.Contains(sessions, item => item.MotivoRevogacao == MotivoRevogacaoSessao.ReutilizacaoDetectada);
            var audits = await db.Auditorias.AsNoTracking()
                .Where(item => item.RegistroId == userId)
                .ToListAsync(TestContext.Current.CancellationToken);
            Assert.Contains(audits, item => item.DadosNovos != null &&
                item.DadosNovos.Contains("TokenReuseDetected", StringComparison.Ordinal));
        }

        using var freshLogin = await client.PostAsJsonAsync("/auth/login", new { email, password }, cancellationToken: TestContext.Current.CancellationToken);
        freshLogin.EnsureSuccessStatusCode();
        using var freshRefresh = await SendSessionRequestAsync(
            client, "/auth/refresh", csrf.RequestToken, csrfCookie, GetCookie(freshLogin, "cav_refresh"));
        freshRefresh.EnsureSuccessStatusCode();
        using var recoveryScope = factory.Services.CreateScope();
        var recoveryDb = recoveryScope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var activeFamily = await recoveryDb.SessoesAutenticacao.AsNoTracking()
            .Where(item => item.UsuarioId == userId && item.RevogadaEm == null && item.ConsumidaEm == null)
            .Select(item => item.FamiliaId)
            .SingleAsync(TestContext.Current.CancellationToken);
        Assert.NotEqual(revokedFamily, activeFamily);
    }

    private static async Task<HttpStatusCode> ReadProtectedAsync(HttpClient client, string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/access-records/open");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        using var response = await client.SendAsync(request, TestContext.Current.CancellationToken);
        return response.StatusCode;
    }

    private sealed class DiscardFirstRefreshResponseHandler(HttpMessageHandler innerHandler)
        : DelegatingHandler(innerHandler)
    {
        public bool ResponseDiscardedAfterSuccess { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var response = await base.SendAsync(request, cancellationToken);
            if (!ResponseDiscardedAfterSuccess &&
                request.RequestUri?.AbsolutePath == "/auth/refresh" &&
                response.IsSuccessStatusCode)
            {
                ResponseDiscardedAfterSuccess = true;
                response.Dispose();
                throw new HttpRequestException("Simulated response loss after committed rotation.");
            }

            return response;
        }
    }

    private static async Task<HttpResponseMessage> SendSessionRequestAsync(
        HttpClient client,
        string path,
        string csrfToken,
        string csrfCookie,
        string refreshToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path);
        request.Headers.Add("X-CSRF-TOKEN", csrfToken);
        request.Headers.Add(
            "Cookie",
            $"cav_csrf={csrfCookie}; cav_refresh={refreshToken}");
        return await client.SendAsync(request);
    }

    private static string GetCookie(HttpResponseMessage response, string name)
    {
        var cookie = Assert.Single(
            response.Headers.GetValues("Set-Cookie"),
            value => value.StartsWith($"{name}=", StringComparison.Ordinal));
        return cookie.Split(';', 2)[0].Split('=', 2)[1];
    }

    private static DateTime ReadUtcHeader(
        HttpResponseMessage response,
        string name)
    {
        var value = Assert.Single(response.Headers.GetValues(name));
        return DateTime.Parse(
            value,
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.RoundtripKind);
    }

    private async Task<string> CreateUserAsync(string password, bool operational = false)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHashService>();
        var suffix = Guid.NewGuid().ToString("N");
        var profileName = operational
            ? ProfileNames.Doorman
            : $"SessionTest{suffix}";
        var profile = await dbContext.Perfis.SingleOrDefaultAsync(item => item.Nome == profileName);
        if (profile is null)
        {
            profile = new Perfil(profileName, "Test-only session profile.");
            dbContext.Perfis.Add(profile);
        }

        var person = new Pessoa($"Pessoa de Teste {suffix}");
        dbContext.Pessoas.Add(person);
        await dbContext.SaveChangesAsync();

        var email = $"session-{suffix}@example.test";
        dbContext.Usuarios.Add(new Usuario(
            email,
            passwordHasher.Hash(password),
            person.Id,
            profile.Id));
        await dbContext.SaveChangesAsync();
        return email;
    }

    private async Task<int> GetUserIdAsync(string email)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        return await dbContext.Usuarios
            .Where(item => item.Email == email)
            .Select(item => item.Id)
            .SingleAsync();
    }

    private sealed record CsrfResponse(string RequestToken);
    private sealed record LoginResponse(
        string AccessToken,
        DateTime ExpiresAtUtc,
        LoginUserResponse User);
    private sealed record LoginUserResponse(int Id, string Email, string ProfileName);
}
