using System.Security.Cryptography;
using System.Text;
using ControleAcessoVeiculos.Application.Authentication;
using Microsoft.AspNetCore.WebUtilities;

namespace ControleAcessoVeiculos.API.Security;

public sealed class CryptographicRefreshTokenService : IRefreshTokenService
{
    private const int TokenSizeInBytes = 32;

    public RefreshToken Create()
    {
        var value = WebEncoders.Base64UrlEncode(
            RandomNumberGenerator.GetBytes(TokenSizeInBytes));

        return new RefreshToken(value, ComputeHash(value));
    }

    public string ComputeHash(string token)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexStringLower(hash);
    }
}
