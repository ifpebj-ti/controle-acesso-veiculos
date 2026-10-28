using ControleAcessoVeiculos.Application.Accounts;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class TemporaryCredentialPolicyTests
{
    [Theory]
    [InlineData(4)]
    [InlineData(1441)]
    public void ValidateRejectsLifetimeOutsideAllowedRange(int lifetimeMinutes)
    {
        var policy = new TemporaryCredentialPolicy(
            TimeSpan.FromMinutes(lifetimeMinutes));

        Assert.Throws<InvalidOperationException>(() => policy.Validate());
    }

    [Theory]
    [InlineData(5)]
    [InlineData(1440)]
    public void ValidateAcceptsInclusiveLifetimeLimits(int lifetimeMinutes)
    {
        var policy = new TemporaryCredentialPolicy(
            TimeSpan.FromMinutes(lifetimeMinutes));

        Assert.Same(policy, policy.Validate());
    }
}
