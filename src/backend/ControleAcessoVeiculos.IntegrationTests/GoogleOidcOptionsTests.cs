using ControleAcessoVeiculos.API.Security;

namespace ControleAcessoVeiculos.IntegrationTests;

public sealed class GoogleOidcOptionsTests
{
    [Fact]
    public void DisabledProviderDoesNotRequireCredentials()
    {
        var options = new GoogleOidcOptions();

        options.Validate();
    }

    [Theory]
    [InlineData("", "secret")]
    [InlineData("client", "")]
    public void EnabledProviderRequiresBothCredentials(
        string clientId,
        string clientSecret)
    {
        var options = new GoogleOidcOptions
        {
            Enabled = true,
            ClientId = clientId,
            ClientSecret = clientSecret
        };

        Assert.Throws<InvalidOperationException>(options.Validate);
    }

    [Theory]
    [InlineData("https://attacker.example/callback")]
    [InlineData("//attacker.example/callback")]
    [InlineData("signin-google")]
    [InlineData("/signin-google?next=https://attacker.example")]
    [InlineData("/signin-google#fragment")]
    public void EnabledProviderRejectsNonLocalCallbackPaths(string callbackPath)
    {
        var options = CreateEnabledOptions(callbackPath: callbackPath);

        Assert.Throws<InvalidOperationException>(options.Validate);
    }

    [Theory]
    [InlineData("https://attacker.example/complete")]
    [InlineData("//attacker.example/complete")]
    [InlineData("auth/google/complete")]
    [InlineData("/auth/google/complete?token=unsafe")]
    public void EnabledProviderRejectsNonLocalCompletionPaths(string completionPath)
    {
        var options = CreateEnabledOptions(completionPath: completionPath);

        Assert.Throws<InvalidOperationException>(options.Validate);
    }

    [Fact]
    public void EnabledProviderAcceptsCompleteExternalConfiguration()
    {
        var options = CreateEnabledOptions();

        options.Validate();
    }

    private static GoogleOidcOptions CreateEnabledOptions(
        string callbackPath = GoogleOidcOptions.DefaultCallbackPath,
        string completionPath = GoogleOidcOptions.DefaultFrontendCompletionPath) =>
        new()
        {
            Enabled = true,
            ClientId = "test-client.apps.googleusercontent.com",
            ClientSecret = "test-secret-not-for-production",
            CallbackPath = callbackPath,
            FrontendCompletionPath = completionPath
        };
}
