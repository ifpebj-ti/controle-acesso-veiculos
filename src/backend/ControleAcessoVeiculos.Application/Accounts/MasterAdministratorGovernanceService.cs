using ControleAcessoVeiculos.Application.Authorization;

namespace ControleAcessoVeiculos.Application.Accounts;

public sealed class MasterAdministratorGovernanceService(
    IUserAccountStore store,
    TimeProvider timeProvider)
{
    public async Task<ChangeUserAuthorizationResult> ChangeAuthorizationAsync(
        int userId,
        int actorUserId,
        ChangeUserAuthorizationCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        var errors = Validate(userId, command);
        if (errors.Count > 0)
        {
            return new(ChangeUserAuthorizationStatus.Invalid, false, errors);
        }

        if (userId == actorUserId)
        {
            return new(
                ChangeUserAuthorizationStatus.SelfChange,
                false,
                new Dictionary<string, string[]>
                {
                    ["user"] = ["Use outra conta de Administrador mestre para alterar a própria autorização."]
                });
        }

        var storeResult = await store.TryChangeAuthorizationAsync(
            userId,
            actorUserId,
            command.ProfileName,
            command.IsMasterAdministrator,
            command.CurrentPassword,
            command.Reason.Trim(),
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        var status = storeResult.Status switch
        {
            ChangeUserAuthorizationStoreStatus.Success =>
                ChangeUserAuthorizationStatus.Success,
            ChangeUserAuthorizationStoreStatus.NotFound =>
                ChangeUserAuthorizationStatus.NotFound,
            ChangeUserAuthorizationStoreStatus.ActorNotAuthorized =>
                ChangeUserAuthorizationStatus.Forbidden,
            ChangeUserAuthorizationStoreStatus.InvalidStepUp =>
                ChangeUserAuthorizationStatus.InvalidStepUp,
            ChangeUserAuthorizationStoreStatus.SelfChange =>
                ChangeUserAuthorizationStatus.SelfChange,
            ChangeUserAuthorizationStoreStatus.Inactive =>
                ChangeUserAuthorizationStatus.Inactive,
            _ => ChangeUserAuthorizationStatus.Conflict
        };

        return new(status, storeResult.Changed, EmptyErrors());
    }

    private static Dictionary<string, string[]> Validate(
        int userId,
        ChangeUserAuthorizationCommand command)
    {
        var errors = new Dictionary<string, string[]>();

        if (userId <= 0)
        {
            errors["userId"] = ["O identificador do usuário deve ser positivo."];
        }

        if (!ProfileNames.Supported.Contains(command.ProfileName))
        {
            errors["profileName"] = ["O perfil informado não é suportado."];
        }

        if (command.IsMasterAdministrator &&
            command.ProfileName != ProfileNames.Administrator)
        {
            errors["isMasterAdministrator"] =
                ["O privilégio de Administrador mestre exige o perfil Administrador."];
        }

        if (string.IsNullOrWhiteSpace(command.CurrentPassword) ||
            command.CurrentPassword.Length > 1024)
        {
            errors["currentPassword"] = ["Confirme a senha atual do Administrador mestre."];
        }

        if (string.IsNullOrWhiteSpace(command.Reason) ||
            command.Reason.Trim().Length is < 10 or > 500)
        {
            errors["reason"] = ["A justificativa deve possuir entre 10 e 500 caracteres."];
        }

        return errors;
    }

    private static IReadOnlyDictionary<string, string[]> EmptyErrors() =>
        new Dictionary<string, string[]>();
}
