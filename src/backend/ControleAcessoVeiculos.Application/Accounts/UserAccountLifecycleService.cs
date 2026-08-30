namespace ControleAcessoVeiculos.Application.Accounts;

public sealed class UserAccountLifecycleService(
    IUserAccountStore store,
    TimeProvider timeProvider)
{
    public async Task<SearchUserAccountsResult> SearchAsync(
        SearchUserAccountsCommand command,
        CancellationToken cancellationToken = default)
    {
        var errors = ValidateSearch(command);
        if (errors.Count > 0)
        {
            return new(SearchUserAccountsStatus.Invalid, null, errors);
        }

        var result = await store.SearchAsync(
            new UserAccountSearchCriteria(
                NormalizeOptional(command.Search),
                command.Active,
                command.Page,
                command.PageSize),
            cancellationToken);

        return new(
            SearchUserAccountsStatus.Success,
            result,
            EmptyErrors());
    }

    public Task<ChangeUserAccountStateResult> DeactivateAsync(
        int userId,
        int actorUserId,
        CancellationToken cancellationToken = default) =>
        ChangeStateAsync(userId, active: false, actorUserId, cancellationToken);

    public Task<ChangeUserAccountStateResult> ReactivateAsync(
        int userId,
        int actorUserId,
        CancellationToken cancellationToken = default) =>
        ChangeStateAsync(userId, active: true, actorUserId, cancellationToken);

    private async Task<ChangeUserAccountStateResult> ChangeStateAsync(
        int userId,
        bool active,
        int actorUserId,
        CancellationToken cancellationToken)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        if (userId <= 0)
        {
            return new(
                ChangeUserAccountStateStatus.Invalid,
                new Dictionary<string, string[]>
                {
                    ["userId"] = ["O identificador do usuário deve ser positivo."]
                });
        }

        if (!active && userId == actorUserId)
        {
            return new(
                ChangeUserAccountStateStatus.SelfDeactivation,
                new Dictionary<string, string[]>
                {
                    ["user"] = ["Um administrador não pode desativar a própria conta."]
                });
        }

        var storeStatus = await store.TrySetActiveAsync(
            userId,
            active,
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        var status = storeStatus switch
        {
            UserAccountStoreStateStatus.Success => ChangeUserAccountStateStatus.Success,
            UserAccountStoreStateStatus.NotFound => ChangeUserAccountStateStatus.NotFound,
            UserAccountStoreStateStatus.LastAdministrator =>
                ChangeUserAccountStateStatus.LastAdministrator,
            _ => ChangeUserAccountStateStatus.Conflict
        };

        return new(status, EmptyErrors());
    }

    private static Dictionary<string, string[]> ValidateSearch(
        SearchUserAccountsCommand command)
    {
        var errors = new Dictionary<string, string[]>();

        if (command.Search?.Trim().Length > 254)
        {
            errors["search"] = ["A busca deve possuir até 254 caracteres."];
        }

        if (command.Page is <= 0 or > 10000)
        {
            errors["page"] = ["A página deve estar entre 1 e 10000."];
        }

        if (command.PageSize is <= 0 or > 100)
        {
            errors["pageSize"] = ["O tamanho da página deve estar entre 1 e 100."];
        }

        return errors;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();

    private static IReadOnlyDictionary<string, string[]> EmptyErrors() =>
        new Dictionary<string, string[]>();
}
