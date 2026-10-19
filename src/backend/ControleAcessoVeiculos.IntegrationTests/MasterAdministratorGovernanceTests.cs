using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class MasterAdministratorGovernanceTests(ApiFactory factory)
{
    private const string Password = "Test-only-password-123!";

    [Fact]
    public async Task OrdinaryAdministratorCannotChangeAuthorization()
    {
        var actor = await CreateUserAsync(
            ProfileNames.Administrator,
            isMasterAdministrator: false);
        var target = await CreateUserAsync(ProfileNames.Doorman);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, actor.Email);

        var response = await ChangeAuthorizationAsync(
            client,
            target.Id,
            Password);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task InvalidStepUpDoesNotChangeAuthorization()
    {
        var actor = await CreateUserAsync(
            ProfileNames.Administrator,
            isMasterAdministrator: true);
        var target = await CreateUserAsync(ProfileNames.Doorman);
        using var client = factory.CreateClient();
        await AuthenticateClientAsync(client, actor.Email);

        var response = await ChangeAuthorizationAsync(
            client,
            target.Id,
            "Wrong-password-123!");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var state = await ReadAuthorizationAsync(target.Id);
        Assert.Equal(ProfileNames.Doorman, state.ProfileName);
        Assert.False(state.IsMasterAdministrator);
    }

    [Fact]
    public async Task MasterChangesAuthorizationRevokesSessionAndAuditsTransition()
    {
        var actor = await CreateUserAsync(
            ProfileNames.Administrator,
            isMasterAdministrator: true);
        var target = await CreateUserAsync(ProfileNames.Doorman);
        using var actorClient = factory.CreateClient();
        using var targetClient = factory.CreateClient();
        await AuthenticateClientAsync(actorClient, actor.Email);
        await AuthenticateClientAsync(targetClient, target.Email);

        var response = await ChangeAuthorizationAsync(
            actorClient,
            target.Id,
            Password);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var state = await ReadAuthorizationAsync(target.Id);
        Assert.Equal(ProfileNames.Administrator, state.ProfileName);
        Assert.True(state.IsMasterAdministrator);

        var requestWithPreviousToken = await targetClient.GetAsync(
            "/users",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, requestWithPreviousToken.StatusCode);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var session = await dbContext.SessoesAutenticacao
            .AsNoTracking()
            .SingleAsync(
                item => item.UsuarioId == target.Id,
                TestContext.Current.CancellationToken);
        Assert.Equal(
            MotivoRevogacaoSessao.AutorizacaoAlterada,
            session.MotivoRevogacao);

        var audit = await dbContext.Auditorias
            .AsNoTracking()
            .Where(item =>
                item.Entidade == nameof(Usuario) &&
                item.RegistroId == target.Id &&
                item.TipoAcao == TipoAcaoAuditoria.Alteracao)
            .OrderByDescending(item => item.Id)
            .FirstAsync(TestContext.Current.CancellationToken);
        Assert.Equal(actor.Id, audit.UsuarioId);
        Assert.Contains(ProfileNames.Doorman, audit.DadosAnteriores);
        Assert.Contains(ProfileNames.Administrator, audit.DadosNovos);
        Assert.Contains("Necessidade operacional validada", audit.DadosNovos);
        Assert.DoesNotContain(Password, audit.DadosNovos);
        Assert.DoesNotContain(Password, audit.DadosAnteriores);
    }

    [Fact]
    public async Task ConcurrentRevocationsPreserveOneActiveMasterAdministrator()
    {
        var first = await CreateUserAsync(
            ProfileNames.Administrator,
            isMasterAdministrator: true);
        var second = await CreateUserAsync(
            ProfileNames.Administrator,
            isMasterAdministrator: true);
        var temporarilyDemotedIds = await DemoteOtherMastersDirectlyAsync(
            first.Id,
            second.Id);

        try
        {
            using var firstClient = factory.CreateClient();
            using var secondClient = factory.CreateClient();
            await AuthenticateClientAsync(firstClient, first.Email);
            await AuthenticateClientAsync(secondClient, second.Email);

            var responses = await Task.WhenAll(
                ChangeAuthorizationAsync(
                    firstClient,
                    second.Id,
                    Password,
                    isMasterAdministrator: false),
                ChangeAuthorizationAsync(
                    secondClient,
                    first.Id,
                    Password,
                    isMasterAdministrator: false));

            Assert.Single(
                responses,
                response => response.StatusCode == HttpStatusCode.NoContent);
            Assert.Single(
                responses,
                response => response.StatusCode is HttpStatusCode.Conflict or
                    HttpStatusCode.Forbidden or
                    HttpStatusCode.Unauthorized);
            Assert.Equal(1, await CountActiveMastersAsync(first.Id, second.Id));
        }
        finally
        {
            await RestoreMastersDirectlyAsync(
                temporarilyDemotedIds.Append(first.Id).Append(second.Id));
        }
    }

    private static Task<HttpResponseMessage> ChangeAuthorizationAsync(
        HttpClient client,
        int userId,
        string currentPassword,
        bool isMasterAdministrator = true) =>
        client.PutAsJsonAsync(
            $"/users/{userId}/authorization",
            new
            {
                profileName = ProfileNames.Administrator,
                isMasterAdministrator,
                currentPassword,
                reason = "Necessidade operacional validada"
            },
            TestContext.Current.CancellationToken);

    private async Task<TestUser> CreateUserAsync(
        string profileName,
        bool isMasterAdministrator = false)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var passwordHasher = scope.ServiceProvider
            .GetRequiredService<IPasswordHashService>();
        var suffix = Guid.NewGuid().ToString("N");
        var profile = await dbContext.Perfis.SingleOrDefaultAsync(
            item => item.Nome == profileName,
            TestContext.Current.CancellationToken);
        if (profile is null)
        {
            profile = new Perfil(
                profileName,
                "Perfil criado exclusivamente para teste de integração.");
            dbContext.Perfis.Add(profile);
        }

        var person = new Pessoa($"Pessoa de Teste {suffix}");
        dbContext.Pessoas.Add(person);
        await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        var email = $"master-governance-{suffix}@example.test";
        var user = new Usuario(
            email,
            passwordHasher.Hash(Password),
            person.Id,
            profile.Id,
            administradorMestre: isMasterAdministrator);
        dbContext.Usuarios.Add(user);
        await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        return new TestUser(user.Id, email);
    }

    private static async Task AuthenticateClientAsync(
        HttpClient client,
        string email)
    {
        var response = await client.PostAsJsonAsync(
            "/auth/login",
            new { email, password = Password },
            TestContext.Current.CancellationToken);
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>(
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        Assert.NotNull(body);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.AccessToken);
    }

    private async Task<AuthorizationState> ReadAuthorizationAsync(int userId)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        return await dbContext.Usuarios
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Join(
                dbContext.Perfis.AsNoTracking(),
                user => user.PerfilId,
                profile => profile.Id,
                (user, profile) => new AuthorizationState(
                    profile.Nome,
                    user.AdministradorMestre))
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    private async Task<IReadOnlyList<int>> DemoteOtherMastersDirectlyAsync(
        int firstId,
        int secondId)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        var ids = await dbContext.Usuarios
            .Where(user =>
                user.Ativo &&
                user.AdministradorMestre &&
                user.Id != firstId &&
                user.Id != secondId)
            .Select(user => user.Id)
            .ToListAsync(TestContext.Current.CancellationToken);
        await dbContext.Usuarios
            .Where(user => ids.Contains(user.Id))
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    user => user.AdministradorMestre,
                    false),
                TestContext.Current.CancellationToken);
        return ids;
    }

    private async Task<int> CountActiveMastersAsync(int firstId, int secondId)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        return await dbContext.Usuarios.CountAsync(
            user =>
                user.Ativo &&
                user.AdministradorMestre &&
                (user.Id == firstId || user.Id == secondId),
            TestContext.Current.CancellationToken);
    }

    private async Task RestoreMastersDirectlyAsync(IEnumerable<int> userIds)
    {
        var ids = userIds.Distinct().ToArray();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<ControleAcessoVeiculosDbContext>();
        await dbContext.Usuarios
            .Where(user => ids.Contains(user.Id))
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    user => user.AdministradorMestre,
                    true),
                TestContext.Current.CancellationToken);
    }

    private sealed record TestUser(int Id, string Email);
    private sealed record LoginResponse(string AccessToken);
    private sealed record AuthorizationState(
        string ProfileName,
        bool IsMasterAdministrator);
}
