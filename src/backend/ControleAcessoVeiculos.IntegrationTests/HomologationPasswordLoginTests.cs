using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleAcessoVeiculos.IntegrationTests;

[Collection(IntegrationTestCollection.Name)]
public sealed class HomologationPasswordLoginTests(ApiFactory factory)
{
    private const string Password = "Synthetic-test-only-123!";

    [Theory]
    [InlineData(ProfileNames.Doorman)]
    [InlineData(ProfileNames.SecurityGuard)]
    [InlineData(ProfileNames.TransportationDepartment)]
    public async Task ExceptionAuthenticatesButDoesNotGrantAdministrativePermissions(string profileName)
    {
        var email = await SeedAsync(profileName);
        using var app = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            services.AddSingleton(new AuthenticationMethodPolicy(true, new HomologationTestAccessOptions
            {
                Enabled = true,
                AllowedEmails = [email],
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1)
            }.Validate("Testing", DateTimeOffset.UtcNow)))));
        using var client = app.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/auth/login",
            new { email, password = "wrong-password" }, TestContext.Current.CancellationToken)).StatusCode);
        using var response = await client.PostAsJsonAsync("/auth/login", new { email, password = Password },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        using var data = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(profileName, data.RootElement.GetProperty("user").GetProperty("profileName").GetString());
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
            data.RootElement.GetProperty("accessToken").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/users", TestContext.Current.CancellationToken)).StatusCode);
    }

    [Fact]
    public async Task ExactTestAccountStillLocksAfterWrongPasswords()
    {
        var email = await SeedAsync(ProfileNames.Doorman);
        using var app = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            services.AddSingleton(new AuthenticationMethodPolicy(true,
                new HomologationPasswordAccessPolicy([email], DateTime.UtcNow.AddHours(1))))));
        using var client = app.CreateClient();
        for (var attempt = 0; attempt < LoginService.MaximumFailedAttempts; attempt++)
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/auth/login",
                new { email, password = "wrong-password" }, TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/auth/login",
            new { email, password = Password }, TestContext.Current.CancellationToken)).StatusCode);
    }

    private async Task<string> SeedAsync(string role)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ControleAcessoVeiculosDbContext>();
        var profile = await db.Perfis.SingleOrDefaultAsync(x => x.Nome == role, TestContext.Current.CancellationToken);
        if (profile is null) { profile = new(role, "Synthetic fixture"); db.Perfis.Add(profile); }
        var person = new Pessoa("Synthetic professor fixture");
        db.Pessoas.Add(person);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        var email = $"professor-{Guid.NewGuid():N}@example.test";
        db.Usuarios.Add(new(email, scope.ServiceProvider.GetRequiredService<IPasswordHashService>().Hash(Password), person.Id, profile.Id));
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return email;
    }
}
