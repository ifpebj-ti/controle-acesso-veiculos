using ControleAcessoVeiculos.Application.Authentication;

namespace ControleAcessoVeiculos.Application.Accounts;

public sealed class AdministrativeCredentialResetService(
    IUserAccountStore store,
    IPasswordHashService passwordHashService,
    ITemporaryCredentialGenerator temporaryCredentialGenerator,
    TemporaryCredentialPolicy policy,
    TimeProvider timeProvider)
{
    public async Task<AdministrativeCredentialResetResult> ResetAsync(
        int userId,
        int actorUserId,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var errors = Validate(userId, actorUserId, reason);
        if (errors.Count > 0)
        {
            return AdministrativeCredentialResetResult.Validation(errors);
        }

        var temporaryCredential = temporaryCredentialGenerator.Create();
        var occurredAtUtc = timeProvider.GetUtcNow().UtcDateTime;
        var expiresAtUtc = occurredAtUtc.Add(policy.Lifetime);
        var storeResult = await store.TryResetCredentialAsync(
            userId,
            actorUserId,
            passwordHashService.Hash(temporaryCredential),
            occurredAtUtc,
            expiresAtUtc,
            reason!,
            cancellationToken);

        return storeResult.Status switch
        {
            AdministrativeCredentialResetStoreStatus.Success =>
                AdministrativeCredentialResetResult.Success(
                    temporaryCredential,
                    expiresAtUtc),
            AdministrativeCredentialResetStoreStatus.NotFound =>
                AdministrativeCredentialResetResult.NotFound(),
            AdministrativeCredentialResetStoreStatus.Inactive =>
                AdministrativeCredentialResetResult.Inactive(),
            AdministrativeCredentialResetStoreStatus.SelfReset =>
                AdministrativeCredentialResetResult.SelfReset(),
            _ => throw new ArgumentOutOfRangeException(nameof(storeResult))
        };
    }

    private static Dictionary<string, string[]> Validate(
        int userId,
        int actorUserId,
        string? reason)
    {
        var errors = new Dictionary<string, string[]>();
        if (userId <= 0)
        {
            errors["user"] = ["A conta informada é inválida."];
        }

        if (actorUserId <= 0)
        {
            errors["actor"] = ["O Administrador autenticado é inválido."];
        }

        if (reason is null || !CredentialResetReasons.Supported.Contains(reason))
        {
            errors["reason"] =
                ["Informe um motivo de redefinição pertencente ao catálogo permitido."];
        }

        return errors;
    }
}

public static class CredentialResetReasons
{
    public const string Forgotten = "Esquecimento";
    public const string SuspectedCompromise = "SuspeitaComprometimento";
    public const string CorrectiveProvisioning = "ProvisionamentoCorretivo";

    public static readonly IReadOnlySet<string> Supported = new HashSet<string>(
        [Forgotten, SuspectedCompromise, CorrectiveProvisioning],
        StringComparer.Ordinal);
}

public enum AdministrativeCredentialResetStatus
{
    Success = 1,
    Validation = 2,
    NotFound = 3,
    Inactive = 4,
    SelfReset = 5
}

public sealed record AdministrativeCredentialResetResult(
    AdministrativeCredentialResetStatus Status,
    string? TemporaryCredential,
    DateTime? TemporaryCredentialExpiresAtUtc,
    IReadOnlyDictionary<string, string[]> Errors)
{
    private static readonly IReadOnlyDictionary<string, string[]> EmptyErrors =
        new Dictionary<string, string[]>();

    public static AdministrativeCredentialResetResult Success(
        string temporaryCredential,
        DateTime expiresAtUtc) =>
        new(
            AdministrativeCredentialResetStatus.Success,
            temporaryCredential,
            expiresAtUtc,
            EmptyErrors);

    public static AdministrativeCredentialResetResult Validation(
        IReadOnlyDictionary<string, string[]> errors) =>
        new(AdministrativeCredentialResetStatus.Validation, null, null, errors);

    public static AdministrativeCredentialResetResult NotFound() =>
        new(AdministrativeCredentialResetStatus.NotFound, null, null, EmptyErrors);

    public static AdministrativeCredentialResetResult Inactive() =>
        new(AdministrativeCredentialResetStatus.Inactive, null, null, EmptyErrors);

    public static AdministrativeCredentialResetResult SelfReset() =>
        new(AdministrativeCredentialResetStatus.SelfReset, null, null, EmptyErrors);
}
