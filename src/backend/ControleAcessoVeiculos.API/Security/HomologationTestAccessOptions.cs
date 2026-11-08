using System.Net.Mail;
using ControleAcessoVeiculos.Application.Authentication;

namespace ControleAcessoVeiculos.API.Security;

public sealed class HomologationTestAccessOptions
{
    public const string SectionName = "Authentication:HomologationTestAccess";
    public bool Enabled { get; set; }
    public string[] AllowedEmails { get; set; } = [];
    public DateTimeOffset? ExpiresAtUtc { get; set; }

    public HomologationPasswordAccessPolicy? Validate(string environment, DateTimeOffset now)
    {
        if (!Enabled) return null;
        if (environment is not ("Homologation" or "Testing" or "Development"))
            throw new InvalidOperationException("Temporary test access requires an explicit non-production environment.");
        if (ExpiresAtUtc is null || ExpiresAtUtc.Value.Offset != TimeSpan.Zero ||
            ExpiresAtUtc.Value > now.AddDays(7))
            throw new InvalidOperationException("Temporary test access requires a UTC deadline within seven days.");
        if (AllowedEmails is null || AllowedEmails.Length is < 1 or > 3 ||
            AllowedEmails.Distinct(StringComparer.OrdinalIgnoreCase).Count() != AllowedEmails.Length ||
            AllowedEmails.Any(email => string.IsNullOrWhiteSpace(email) ||
                !MailAddress.TryCreate(email, out var address) || address.Address != email ||
                !email.EndsWith("@example.test", StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException("Temporary test access requires up to three exact synthetic account addresses.");
        // An expired window denies test logins without preventing the rest of the application from starting.
        return new(AllowedEmails, ExpiresAtUtc.Value.UtcDateTime);
    }
}
