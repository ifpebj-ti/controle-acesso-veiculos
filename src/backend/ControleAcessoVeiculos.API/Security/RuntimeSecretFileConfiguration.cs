namespace ControleAcessoVeiculos.API.Security;

public static class RuntimeSecretFileConfiguration
{
    private const int MaximumSecretFileBytes = 16 * 1024;

    private static readonly (string FileKey, string ValueKey)[] SupportedSecrets =
    [
        (
            "ConnectionStrings:DefaultConnectionFile",
            "ConnectionStrings:DefaultConnection"),
        (
            "Authentication:Jwt:SigningKeyFile",
            "Authentication:Jwt:SigningKey"),
        (
            "Authentication:Google:ClientSecretFile",
            "Authentication:Google:ClientSecret")
    ];

    public static IConfigurationManager AddRuntimeSecretFiles(
        this IConfigurationManager configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var secretValues = new Dictionary<string, string?>();

        foreach (var (fileKey, valueKey) in SupportedSecrets)
        {
            AddSecretValue(configuration, secretValues, fileKey, valueKey);
        }

        if (secretValues.Count > 0)
        {
            configuration.AddInMemoryCollection(secretValues);
        }

        return configuration;
    }

    private static void AddSecretValue(
        IConfiguration configuration,
        IDictionary<string, string?> secretValues,
        string fileKey,
        string valueKey)
    {
        var configuredPath = configuration[fileKey];
        if (string.IsNullOrWhiteSpace(configuredPath))
        {
            return;
        }

        if (!string.IsNullOrWhiteSpace(configuration[valueKey]))
        {
            throw new InvalidOperationException(
                $"Configure somente {fileKey}; não combine arquivo e valor direto para {valueKey}.");
        }

        if (!Path.IsPathFullyQualified(configuredPath))
        {
            throw new InvalidOperationException(
                $"{fileKey} deve apontar para um caminho absoluto.");
        }

        string value;
        try
        {
            var file = new FileInfo(configuredPath);
            if (!file.Exists || file.Length is <= 0 or > MaximumSecretFileBytes)
            {
                throw new InvalidOperationException(
                    $"O arquivo configurado em {fileKey} está ausente, vazio ou excede o limite permitido.");
            }

            ValidateFileMetadata(file, fileKey);

            value = File.ReadAllText(file.FullName).TrimEnd('\r', '\n');
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException or
                System.Security.SecurityException)
        {
            throw new InvalidOperationException(
                $"O arquivo configurado em {fileKey} não pôde ser lido com segurança.",
                exception);
        }

        if (string.IsNullOrWhiteSpace(value) || value.Contains('\0'))
        {
            throw new InvalidOperationException(
                $"O arquivo configurado em {fileKey} não contém um valor válido.");
        }

        secretValues[valueKey] = value;
    }

    private static void ValidateFileMetadata(FileInfo file, string fileKey)
    {
        if (file.LinkTarget is not null ||
            file.Attributes.HasFlag(FileAttributes.ReparsePoint))
        {
            throw new InvalidOperationException(
                $"O arquivo configurado em {fileKey} não pode ser um link simbólico.");
        }

        if (OperatingSystem.IsWindows())
        {
            return;
        }

        var mode = File.GetUnixFileMode(file.FullName);
        const UnixFileMode forbiddenPermissions =
            UnixFileMode.GroupWrite |
            UnixFileMode.OtherWrite |
            UnixFileMode.UserExecute |
            UnixFileMode.GroupExecute |
            UnixFileMode.OtherExecute;

        if ((mode & forbiddenPermissions) != 0)
        {
            throw new InvalidOperationException(
                $"O arquivo configurado em {fileKey} possui permissões inseguras.");
        }
    }
}
