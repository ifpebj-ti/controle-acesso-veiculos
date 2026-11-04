using System.Collections.Frozen;
using ControleAcessoVeiculos.Application.Authorization;

namespace ControleAcessoVeiculos.Application.Authentication;

public sealed class HomologationPasswordAccessPolicy(IEnumerable<string> emails, DateTime expiresAtUtc)
{
    private readonly FrozenSet<string> allowedEmails = emails.ToFrozenSet(StringComparer.OrdinalIgnoreCase);
    public DateTime ExpiresAtUtc { get; } = expiresAtUtc;

    public bool Allows(string email, string profile, DateTime nowUtc) =>
        nowUtc < ExpiresAtUtc && allowedEmails.Contains(email) &&
        profile is ProfileNames.Doorman or ProfileNames.SecurityGuard or ProfileNames.TransportationDepartment;
}
