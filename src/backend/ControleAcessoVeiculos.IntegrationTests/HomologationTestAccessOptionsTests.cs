using ControleAcessoVeiculos.API.Security;
using ControleAcessoVeiculos.Application.Authorization;

namespace ControleAcessoVeiculos.IntegrationTests;

public sealed class HomologationTestAccessOptionsTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 3, 12, 0, 0, TimeSpan.Zero);
    private static HomologationTestAccessOptions Options() => new()
    {
        Enabled = true,
        AllowedEmails = ["professor@example.test"],
        ExpiresAtUtc = Now.AddDays(1)
    };

    [Fact]
    public void DisabledOptionsDoNotChangeProduction()
    {
        Assert.Null(new HomologationTestAccessOptions().Validate("Production", Now));
        Assert.Throws<InvalidOperationException>(() => Options().Validate("Production", Now));
    }

    [Theory]
    [InlineData("Homologation")]
    [InlineData("Testing")]
    [InlineData("Development")]
    public void ExactSyntheticOperationalAccountIsAllowedUntilDeadline(string environment)
    {
        var policy = Options().Validate(environment, Now)!;
        Assert.True(policy.Allows("professor@example.test", ProfileNames.Doorman, Now.UtcDateTime));
        Assert.True(policy.Allows("professor@example.test", ProfileNames.SecurityGuard, Now.UtcDateTime));
        Assert.True(policy.Allows("professor@example.test", ProfileNames.TransportationDepartment, Now.UtcDateTime));
        Assert.False(policy.Allows("other@example.test", ProfileNames.Doorman, Now.UtcDateTime));
        Assert.False(policy.Allows("professor@example.test", "Unknown", Now.UtcDateTime));
        Assert.False(policy.Allows("professor@example.test", ProfileNames.Doorman, Now.AddDays(1).UtcDateTime));
    }

    [Fact]
    public void InvalidIdentityListsAndDeadlinesAreRejected()
    {
        foreach (var emails in new[] { Array.Empty<string>(), new[] { "*" }, new[] { "person@gmail.com" },
                     new[] { "Name <professor@example.test>" }, new[] { "a@example.test", "A@example.test" },
                     new[] { "1@example.test", "2@example.test", "3@example.test", "4@example.test" } })
        {
            var options = Options(); options.AllowedEmails = emails;
            Assert.Throws<InvalidOperationException>(() => options.Validate("Homologation", Now));
        }
        var missing = Options(); missing.ExpiresAtUtc = null;
        Assert.Throws<InvalidOperationException>(() => missing.Validate("Homologation", Now));
        var excessive = Options(); excessive.ExpiresAtUtc = Now.AddDays(8);
        Assert.Throws<InvalidOperationException>(() => excessive.Validate("Homologation", Now));
        var nonUtc = Options(); nonUtc.ExpiresAtUtc = Now.ToOffset(TimeSpan.FromHours(-3));
        Assert.Throws<InvalidOperationException>(() => nonUtc.Validate("Homologation", Now));
    }

    [Fact]
    public void ExpiredWindowDoesNotBringNormalApplicationDown()
    {
        var options = Options(); options.ExpiresAtUtc = Now.AddMinutes(-1);
        Assert.False(options.Validate("Homologation", Now)!.Allows(
            "professor@example.test", ProfileNames.Doorman, Now.UtcDateTime));
    }
}
