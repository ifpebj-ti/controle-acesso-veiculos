namespace ControleAcessoVeiculos.Application.Accounts;

public enum CreateUserAccountStatus
{
    Success,
    Invalid,
    Conflict
}

public sealed record CreateUserAccountResult(
    CreateUserAccountStatus Status,
    int? UserId,
    string? Email,
    string? ProfileName,
    string? TemporaryCredential,
    DateTime? TemporaryCredentialExpiresAtUtc,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public static CreateUserAccountResult Success(
        int userId,
        string email,
        string profileName,
        string? temporaryCredential,
        DateTime? temporaryCredentialExpiresAtUtc) =>
        new(CreateUserAccountStatus.Success, userId, email, profileName,
            temporaryCredential, temporaryCredentialExpiresAtUtc,
            new Dictionary<string, string[]>());

    public static CreateUserAccountResult Invalid(
        IReadOnlyDictionary<string, string[]> errors) =>
        new(CreateUserAccountStatus.Invalid, null, null, null, null, null, errors);

    public static CreateUserAccountResult Conflict(string field, string message) =>
        new(CreateUserAccountStatus.Conflict, null, null, null, null, null,
            new Dictionary<string, string[]> { [field] = [message] });
}
