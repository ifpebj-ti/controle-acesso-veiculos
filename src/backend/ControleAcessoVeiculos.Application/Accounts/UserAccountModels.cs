namespace ControleAcessoVeiculos.Application.Accounts;

public sealed record SearchUserAccountsCommand(
    string? Search = null,
    bool? Active = null,
    int Page = 1,
    int PageSize = 25);

public sealed record UserAccountSearchCriteria(
    string? Search,
    bool? Active,
    int Page,
    int PageSize);

public sealed record UserAccountRecord(
    int Id,
    string Name,
    string Email,
    string ProfileName,
    bool Active,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    DateTime? LockedUntilUtc);

public sealed record PagedUserAccountResult(
    IReadOnlyList<UserAccountRecord> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public enum SearchUserAccountsStatus
{
    Success,
    Invalid
}

public sealed record SearchUserAccountsResult(
    SearchUserAccountsStatus Status,
    PagedUserAccountResult? Result,
    IReadOnlyDictionary<string, string[]> Errors);

public enum ChangeUserAccountStateStatus
{
    Success,
    Invalid,
    NotFound,
    Conflict,
    SelfDeactivation,
    LastAdministrator
}

public sealed record ChangeUserAccountStateResult(
    ChangeUserAccountStateStatus Status,
    IReadOnlyDictionary<string, string[]> Errors);

public enum UserAccountStoreStateStatus
{
    Success,
    NotFound,
    Conflict,
    LastAdministrator
}
