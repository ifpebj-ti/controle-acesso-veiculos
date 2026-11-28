namespace ControleAcessoVeiculos.Infrastructure.Search;

internal static class LiteralLikePattern
{
    public static string Escape(string value) => value
        .Replace("\\", "\\\\", StringComparison.Ordinal)
        .Replace("%", "\\%", StringComparison.Ordinal)
        .Replace("_", "\\_", StringComparison.Ordinal);

    public static string Contains(string value) => $"%{Escape(value)}%";
}
