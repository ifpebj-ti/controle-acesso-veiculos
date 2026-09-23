using System.Security.Cryptography;
using ControleAcessoVeiculos.Application.Accounts;
using Microsoft.AspNetCore.WebUtilities;

namespace ControleAcessoVeiculos.API.Security;

public sealed class CryptographicTemporaryCredentialGenerator
    : ITemporaryCredentialGenerator
{
    private const int EntropySizeInBytes = 18;

    public string Create() => WebEncoders.Base64UrlEncode(
        RandomNumberGenerator.GetBytes(EntropySizeInBytes));
}

public sealed class TemporaryCredentialOptions
{
    public const string SectionName = "TemporaryCredential";

    public int LifetimeMinutes { get; set; } = 30;

    public TemporaryCredentialPolicy Validate() =>
        new TemporaryCredentialPolicy(TimeSpan.FromMinutes(LifetimeMinutes)).Validate();
}
