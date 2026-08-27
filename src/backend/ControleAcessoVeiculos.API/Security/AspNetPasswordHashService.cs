using ControleAcessoVeiculos.Application.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace ControleAcessoVeiculos.API.Security;

public sealed class AspNetPasswordHashService : IPasswordHashService
{
    private static readonly object Marker = new();
    private readonly PasswordHasher<object> _hasher;
    private readonly string _dummyHash;

    public AspNetPasswordHashService()
    {
        _hasher = new PasswordHasher<object>(Options.Create(new PasswordHasherOptions
        {
            IterationCount = 210_000
        }));
        _dummyHash = _hasher.HashPassword(Marker, Guid.NewGuid().ToString("N"));
    }

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        return _hasher.HashPassword(Marker, password);
    }

    public bool Verify(string passwordHash, string password) =>
        _hasher.VerifyHashedPassword(Marker, passwordHash, password) is
            PasswordVerificationResult.Success or
            PasswordVerificationResult.SuccessRehashNeeded;

    public void PerformDummyVerification(string password) =>
        _ = _hasher.VerifyHashedPassword(Marker, _dummyHash, password);
}
