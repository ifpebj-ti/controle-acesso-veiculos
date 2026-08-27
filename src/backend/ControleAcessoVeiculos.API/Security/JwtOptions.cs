using System.Text;

namespace ControleAcessoVeiculos.API.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Authentication:Jwt";

    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string SigningKey { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 15;

    public void Validate()
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(Issuer);
        ArgumentException.ThrowIfNullOrWhiteSpace(Audience);

        if (string.IsNullOrWhiteSpace(SigningKey) ||
            Encoding.UTF8.GetByteCount(SigningKey) < 32)
        {
            throw new InvalidOperationException(
                "Authentication:Jwt:SigningKey deve ter pelo menos 32 caracteres e ser fornecida por secret ou variável de ambiente.");
        }

        if (ExpirationMinutes is < 1 or > 60)
        {
            throw new InvalidOperationException(
                "Authentication:Jwt:ExpirationMinutes deve estar entre 1 e 60 minutos.");
        }
    }
}
