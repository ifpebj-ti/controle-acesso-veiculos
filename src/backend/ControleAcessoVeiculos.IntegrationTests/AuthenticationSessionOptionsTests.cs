using ControleAcessoVeiculos.API.Security;

namespace ControleAcessoVeiculos.IntegrationTests;

public sealed class AuthenticationSessionOptionsTests
{
    [Theory]
    [InlineData(5, 1)]
    [InlineData(240, 24)]
    public void Validate_ConvertsSupportedBoundaryValues(int minutes, int hours)
    {
        var policy = new AuthenticationSessionOptions
        {
            InactivityTimeoutMinutes = minutes,
            AbsoluteLifetimeHours = hours
        }.Validate();

        Assert.Equal(TimeSpan.FromMinutes(minutes), policy.InactivityTimeout);
        Assert.Equal(TimeSpan.FromHours(hours), policy.AbsoluteLifetime);
    }

    [Theory]
    [InlineData(4, 12, nameof(AuthenticationSessionOptions.InactivityTimeoutMinutes))]
    [InlineData(241, 12, nameof(AuthenticationSessionOptions.InactivityTimeoutMinutes))]
    [InlineData(15, 0, nameof(AuthenticationSessionOptions.AbsoluteLifetimeHours))]
    [InlineData(15, 25, nameof(AuthenticationSessionOptions.AbsoluteLifetimeHours))]
    public void Validate_RejectsOutOfRangeOptions(int minutes, int hours, string option)
    {
        var options = new AuthenticationSessionOptions
        {
            InactivityTimeoutMinutes = minutes,
            AbsoluteLifetimeHours = hours
        };

        var error = Assert.Throws<InvalidOperationException>(() => options.Validate());

        Assert.Contains(option, error.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("refresh token")]
    [InlineData("refresh;token")]
    [InlineData("refresh=token")]
    [InlineData("refresh,token")]
    public void Validate_RejectsInvalidCookieNames(string cookieName)
    {
        var options = new AuthenticationSessionOptions { RefreshCookieName = cookieName };

        var error = Assert.Throws<InvalidOperationException>(() => options.Validate());

        Assert.Contains(nameof(AuthenticationSessionOptions.RefreshCookieName), error.Message);
    }

    [Fact]
    public void Validate_RejectsInactivityWindowEqualToAbsoluteLifetime()
    {
        var options = new AuthenticationSessionOptions
        {
            InactivityTimeoutMinutes = 60,
            AbsoluteLifetimeHours = 1
        };

        Assert.Throws<ArgumentOutOfRangeException>(() => options.Validate());
    }
}
