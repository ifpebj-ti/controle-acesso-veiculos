using System.Net.Mail;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.Accounts;

public sealed class CreateUserAccountService(
    IUserAccountStore userAccountStore,
    IPasswordHashService passwordHashService,
    TimeProvider timeProvider)
{
    public Task<CreateUserAccountResult> CreateAsync(
        CreateUserAccountCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);
        return CreateAsync(
            command,
            new AccountCreationAudit(
                actorUserId,
                timeProvider.GetUtcNow().UtcDateTime,
                AccountCreationOrigin.Administration),
            cancellationToken);
    }

    public Task<CreateUserAccountResult> BootstrapAsync(
        CreateUserAccountCommand command,
        CancellationToken cancellationToken = default) =>
        CreateAsync(
            command,
            new AccountCreationAudit(
                null,
                timeProvider.GetUtcNow().UtcDateTime,
                AccountCreationOrigin.Bootstrap),
            cancellationToken);

    private async Task<CreateUserAccountResult> CreateAsync(
        CreateUserAccountCommand command,
        AccountCreationAudit audit,
        CancellationToken cancellationToken = default)
    {
        var errors = Validate(command);

        if (errors.Count > 0)
        {
            return CreateUserAccountResult.Invalid(errors);
        }

        var normalizedEmail = Usuario.NormalizarEmail(command.Email);
        var createdAccount = await userAccountStore.TryCreateAsync(
            command.Name.Trim(),
            normalizedEmail,
            passwordHashService.Hash(command.Password),
            command.ProfileName,
            audit,
            cancellationToken);

        return createdAccount is null
            ? CreateUserAccountResult.Conflict(
                "email",
                "Já existe uma conta ou pessoa cadastrada com este e-mail.")
            : CreateUserAccountResult.Success(
                createdAccount.UserId,
                createdAccount.Email,
                createdAccount.ProfileName);
    }

    private static Dictionary<string, string[]> Validate(CreateUserAccountCommand command)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(command.Name) || command.Name.Trim().Length > 200)
        {
            errors["name"] = ["O nome é obrigatório e deve possuir até 200 caracteres."];
        }

        var normalizedEmail = command.Email?.Trim() ?? string.Empty;

        if (normalizedEmail.Length > 254 ||
            !MailAddress.TryCreate(normalizedEmail, out var parsedEmail) ||
            !string.Equals(parsedEmail.Address, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            errors["email"] = ["Informe um e-mail válido com até 254 caracteres."];
        }

        if (string.IsNullOrWhiteSpace(command.Password) ||
            command.Password.Length is < 12 or > 128)
        {
            errors["password"] = ["A senha deve possuir entre 12 e 128 caracteres."];
        }

        if (!ProfileNames.Supported.Contains(command.ProfileName))
        {
            errors["profileName"] = ["O perfil informado não pertence ao conjunto preliminar do MVP."];
        }

        return errors;
    }
}
