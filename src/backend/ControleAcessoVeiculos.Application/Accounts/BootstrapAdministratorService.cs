using ControleAcessoVeiculos.Application.Authorization;

namespace ControleAcessoVeiculos.Application.Accounts;

public enum BootstrapAdministratorStatus
{
    Success,
    AlreadyInitialized,
    Invalid,
    Conflict
}

public sealed class BootstrapAdministratorService(
    IUserAccountStore userAccountStore,
    CreateUserAccountService createUserAccountService)
{
    public async Task<BootstrapAdministratorStatus> BootstrapAsync(
        string name,
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        if (await userAccountStore.HasAnyUserAsync(cancellationToken))
        {
            return BootstrapAdministratorStatus.AlreadyInitialized;
        }

        var result = await createUserAccountService.BootstrapAsync(
            new CreateUserAccountCommand(
                name,
                email,
                password,
                ProfileNames.Administrator),
            cancellationToken);

        return result.Status switch
        {
            CreateUserAccountStatus.Success => BootstrapAdministratorStatus.Success,
            CreateUserAccountStatus.Invalid => BootstrapAdministratorStatus.Invalid,
            _ => BootstrapAdministratorStatus.Conflict
        };
    }
}
