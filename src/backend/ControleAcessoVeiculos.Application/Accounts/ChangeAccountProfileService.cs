using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Accounts;

public sealed class ChangeAccountProfileService(
    IAccountProfileStore store,
    IPasswordHashService passwordHashService,
    ITemporaryCredentialGenerator temporaryCredentialGenerator,
    TemporaryCredentialPolicy temporaryCredentialPolicy,
    TimeProvider timeProvider)
{
    public async Task<ChangeAccountProfileResult> ChangeAsync(
        int userId,
        int actorUserId,
        string? profileName,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var errors = Validate(userId, actorUserId, profileName, reason);
        if (errors.Count > 0)
        {
            return ChangeAccountProfileResult.Invalid(errors);
        }

        if (userId == actorUserId)
        {
            return ChangeAccountProfileResult.SelfChange();
        }

        var normalizedProfileName = profileName!.Trim();
        var authenticationMethod = normalizedProfileName == ProfileNames.Administrator
            ? MetodoAutenticacao.Local
            : MetodoAutenticacao.Google;
        var occurredAtUtc = timeProvider.GetUtcNow().UtcDateTime;
        var temporaryCredential = authenticationMethod == MetodoAutenticacao.Local
            ? temporaryCredentialGenerator.Create()
            : null;
        var expiresAtUtc = temporaryCredential is null
            ? (DateTime?)null
            : occurredAtUtc.Add(temporaryCredentialPolicy.Lifetime);
        var temporaryPasswordHash = temporaryCredential is null
            ? null
            : passwordHashService.Hash(temporaryCredential);

        var storeResult = await store.TryChangeProfileAsync(
            userId,
            actorUserId,
            normalizedProfileName,
            authenticationMethod,
            temporaryPasswordHash,
            expiresAtUtc,
            occurredAtUtc,
            reason!.Trim(),
            cancellationToken);

        return storeResult.Status switch
        {
            ChangeAccountProfileStoreStatus.Success =>
                ChangeAccountProfileResult.Success(
                    storeResult.PreviousProfileName!,
                    storeResult.CurrentProfileName!,
                    storeResult.CurrentAuthenticationMethod!.Value,
                    temporaryCredential,
                    expiresAtUtc),
            ChangeAccountProfileStoreStatus.NotFound =>
                ChangeAccountProfileResult.NotFound(),
            ChangeAccountProfileStoreStatus.Inactive =>
                ChangeAccountProfileResult.Inactive(),
            ChangeAccountProfileStoreStatus.SelfChange =>
                ChangeAccountProfileResult.SelfChange(),
            ChangeAccountProfileStoreStatus.ProfileNotFound =>
                ChangeAccountProfileResult.ProfileNotFound(),
            ChangeAccountProfileStoreStatus.LastAdministrator =>
                ChangeAccountProfileResult.LastAdministrator(),
            _ => ChangeAccountProfileResult.Conflict()
        };
    }

    private static Dictionary<string, string[]> Validate(
        int userId,
        int actorUserId,
        string? profileName,
        string? reason)
    {
        var errors = new Dictionary<string, string[]>();
        if (userId <= 0)
        {
            errors["userId"] = ["O identificador do usuário deve ser positivo."];
        }

        if (actorUserId <= 0)
        {
            errors["actor"] = ["O Administrador autenticado é inválido."];
        }

        if (profileName is null || !ProfileNames.Supported.Contains(profileName.Trim()))
        {
            errors["profileName"] = ["Informe um dos quatro perfis autorizados."];
        }

        var normalizedReason = reason?.Trim() ?? string.Empty;
        if (normalizedReason.Length is < 10 or > 500)
        {
            errors["reason"] = ["A justificativa deve possuir entre 10 e 500 caracteres."];
        }

        return errors;
    }
}

public enum ChangeAccountProfileStatus
{
    Success,
    Invalid,
    NotFound,
    Inactive,
    SelfChange,
    ProfileNotFound,
    Conflict,
    LastAdministrator
}

public sealed record ChangeAccountProfileResult(
    ChangeAccountProfileStatus Status,
    string? PreviousProfileName,
    string? CurrentProfileName,
    MetodoAutenticacao? AuthenticationMethod,
    string? TemporaryCredential,
    DateTime? TemporaryCredentialExpiresAtUtc,
    IReadOnlyDictionary<string, string[]> Errors)
{
    private static readonly IReadOnlyDictionary<string, string[]> EmptyErrors =
        new Dictionary<string, string[]>();

    public static ChangeAccountProfileResult Success(
        string previousProfileName,
        string currentProfileName,
        MetodoAutenticacao authenticationMethod,
        string? temporaryCredential,
        DateTime? expiresAtUtc) => new(
            ChangeAccountProfileStatus.Success,
            previousProfileName,
            currentProfileName,
            authenticationMethod,
            temporaryCredential,
            expiresAtUtc,
            EmptyErrors);

    public static ChangeAccountProfileResult Invalid(
        IReadOnlyDictionary<string, string[]> errors) =>
        Empty(ChangeAccountProfileStatus.Invalid, errors);

    public static ChangeAccountProfileResult NotFound() =>
        Empty(ChangeAccountProfileStatus.NotFound);

    public static ChangeAccountProfileResult Inactive() =>
        Empty(ChangeAccountProfileStatus.Inactive);

    public static ChangeAccountProfileResult SelfChange() =>
        Empty(ChangeAccountProfileStatus.SelfChange);

    public static ChangeAccountProfileResult ProfileNotFound() =>
        Empty(ChangeAccountProfileStatus.ProfileNotFound);

    public static ChangeAccountProfileResult Conflict() =>
        Empty(ChangeAccountProfileStatus.Conflict);

    public static ChangeAccountProfileResult LastAdministrator() =>
        Empty(ChangeAccountProfileStatus.LastAdministrator);

    private static ChangeAccountProfileResult Empty(
        ChangeAccountProfileStatus status,
        IReadOnlyDictionary<string, string[]>? errors = null) =>
        new(status, null, null, null, null, null, errors ?? EmptyErrors);
}
