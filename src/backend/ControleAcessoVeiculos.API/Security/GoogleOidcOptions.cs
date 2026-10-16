namespace ControleAcessoVeiculos.API.Security;

public sealed class GoogleOidcOptions
{
    public const string SectionName = "Authentication:Google";
    public const string DefaultCallbackPath = "/signin-google";
    public const string DefaultFrontendCompletionPath = "/auth/google/complete";

    public bool Enabled { get; init; }
    public string ClientId { get; init; } = string.Empty;
    public string ClientSecret { get; init; } = string.Empty;
    public string CallbackPath { get; init; } = DefaultCallbackPath;
    public string FrontendCompletionPath { get; init; } = DefaultFrontendCompletionPath;

    public void Validate()
    {
        if (!Enabled)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(ClientId))
        {
            throw new InvalidOperationException(
                "Authentication:Google:ClientId deve ser fornecido por configuraÃ§Ã£o externa quando o Google OIDC estiver habilitado.");
        }

        if (string.IsNullOrWhiteSpace(ClientSecret))
        {
            throw new InvalidOperationException(
                "Authentication:Google:ClientSecret deve ser fornecido por secret ou variÃ¡vel de ambiente quando o Google OIDC estiver habilitado.");
        }

        ValidateLocalPath(CallbackPath, "CallbackPath");
        ValidateLocalPath(FrontendCompletionPath, "FrontendCompletionPath");
    }

    private static void ValidateLocalPath(string path, string optionName)
    {
        if (string.IsNullOrWhiteSpace(path) ||
            !path.StartsWith("/", StringComparison.Ordinal) ||
            path.StartsWith("//", StringComparison.Ordinal) ||
            path.Contains("?", StringComparison.Ordinal) ||
            path.Contains("#", StringComparison.Ordinal) ||
            Uri.TryCreate(path, UriKind.Absolute, out _))
        {
            throw new InvalidOperationException(
                $"Authentication:Google:{optionName} deve ser um caminho local absoluto, sem host, query string ou fragmento.");
        }
    }
}
