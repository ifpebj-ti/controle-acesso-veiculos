using ControleAcessoVeiculos.API.Security;
using Microsoft.Extensions.Configuration;

namespace ControleAcessoVeiculos.IntegrationTests;

public sealed class RuntimeSecretFileConfigurationTests
{
    [Fact]
    public void AddRuntimeSecretFiles_LoadsSupportedFilesWithoutTrimmingSpaces()
    {
        using var files = new TemporarySecretFiles();
        var connectionStringPath = files.Create(
            "Host=postgresql;Password=fictitious-password; ");
        var jwtPath = files.Create(new string('j', 48));
        var googlePath = files.Create("fictitious-google-secret");
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnectionFile"] = connectionStringPath,
            ["Authentication:Jwt:SigningKeyFile"] = jwtPath,
            ["Authentication:Google:ClientSecretFile"] = googlePath
        });

        configuration.AddRuntimeSecretFiles();

        Assert.Equal(
            "Host=postgresql;Password=fictitious-password; ",
            configuration.GetConnectionString("DefaultConnection"));
        Assert.Equal(new string('j', 48), configuration["Authentication:Jwt:SigningKey"]);
        Assert.Equal(
            "fictitious-google-secret",
            configuration["Authentication:Google:ClientSecret"]);
    }

    [Fact]
    public void AddRuntimeSecretFiles_RemovesOnlyTrailingLineEndings()
    {
        using var files = new TemporarySecretFiles();
        var path = files.Create($"  fictitious-value  {Environment.NewLine}");
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Authentication:Google:ClientSecretFile"] = path
        });

        configuration.AddRuntimeSecretFiles();

        Assert.Equal(
            "  fictitious-value  ",
            configuration["Authentication:Google:ClientSecret"]);
    }

    [Fact]
    public void AddRuntimeSecretFiles_LeavesDirectConfigurationWhenNoFileIsConfigured()
    {
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Authentication:Jwt:SigningKey"] = new string('d', 48)
        });

        configuration.AddRuntimeSecretFiles();

        Assert.Equal(new string('d', 48), configuration["Authentication:Jwt:SigningKey"]);
    }

    [Fact]
    public void AddRuntimeSecretFiles_RejectsAmbiguousDirectAndFileConfiguration()
    {
        using var files = new TemporarySecretFiles();
        var path = files.Create(new string('f', 48));
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Authentication:Jwt:SigningKey"] = new string('d', 48),
            ["Authentication:Jwt:SigningKeyFile"] = path
        });

        var exception = Assert.Throws<InvalidOperationException>(
            configuration.AddRuntimeSecretFiles);

        Assert.Contains("não combine arquivo e valor direto", exception.Message);
        Assert.DoesNotContain(new string('d', 48), exception.Message);
        Assert.DoesNotContain(new string('f', 48), exception.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("value\0with-null")]
    public void AddRuntimeSecretFiles_RejectsInvalidContent(string content)
    {
        using var files = new TemporarySecretFiles();
        var path = files.Create(content);
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Authentication:Google:ClientSecretFile"] = path
        });

        var exception = Assert.Throws<InvalidOperationException>(
            configuration.AddRuntimeSecretFiles);

        if (content.Length > 0)
        {
            Assert.DoesNotContain(content, exception.Message);
        }
    }

    [Fact]
    public void AddRuntimeSecretFiles_RejectsRelativePath()
    {
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Authentication:Jwt:SigningKeyFile"] = "relative-secret.txt"
        });

        var exception = Assert.Throws<InvalidOperationException>(
            configuration.AddRuntimeSecretFiles);

        Assert.Contains("caminho absoluto", exception.Message);
    }

    [Fact]
    public void AddRuntimeSecretFiles_RejectsMissingFile()
    {
        var path = Path.Combine(Path.GetTempPath(), $"missing-{Guid.NewGuid():N}");
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Authentication:Google:ClientSecretFile"] = path
        });

        var exception = Assert.Throws<InvalidOperationException>(
            configuration.AddRuntimeSecretFiles);

        Assert.Contains("ausente, vazio ou excede", exception.Message);
    }

    [Fact]
    public void AddRuntimeSecretFiles_RejectsOversizedFile()
    {
        using var files = new TemporarySecretFiles();
        var path = files.Create(new string('x', (16 * 1024) + 1));
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnectionFile"] = path
        });

        Assert.Throws<InvalidOperationException>(configuration.AddRuntimeSecretFiles);
    }

    private static ConfigurationManager CreateConfiguration(
        IDictionary<string, string?> values)
    {
        var configuration = new ConfigurationManager();
        configuration.AddInMemoryCollection(values);
        return configuration;
    }

    private sealed class TemporarySecretFiles : IDisposable
    {
        private readonly List<string> _paths = [];

        public string Create(string content)
        {
            var path = Path.Combine(Path.GetTempPath(), $"cav-secret-{Guid.NewGuid():N}");
            File.WriteAllText(path, content);
            _paths.Add(path);
            return path;
        }

        public void Dispose()
        {
            foreach (var path in _paths)
            {
                File.Delete(path);
            }
        }
    }
}
