using System.Reflection;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class ArchitectureTests
{
    [Fact]
    public void ApplicationDoesNotReferenceOuterLayers()
    {
        var applicationAssembly = Assembly.Load("ControleAcessoVeiculos.Application");
        var referencedAssemblies = applicationAssembly
            .GetReferencedAssemblies()
            .Select(reference => reference.Name)
            .ToArray();

        Assert.DoesNotContain("ControleAcessoVeiculos.API", referencedAssemblies);
        Assert.DoesNotContain("ControleAcessoVeiculos.Infrastructure", referencedAssemblies);
    }
}
