using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Application.Authentication;

public sealed class AuthenticatedPasswordChangeService(
    IAuthenticatedPasswordChangeStore store,
    IPasswordHashService passwordHashService,
    TimeProvider timeProvider)
{
    public Task<AuthenticatedPasswordChangeResult> ChangeAsync(
        int userId,
        string? currentPassword,
        string? newPassword,
        CancellationToken cancellationToken = default)
    {
        var errors = Validate(userId, currentPassword, newPassword);
        if (errors.Count > 0)
        {
            return Task.FromResult(AuthenticatedPasswordChangeResult.Validation(errors));
        }

        return store.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                var user = await store.FindUserForUpdateAsync(
                    userId,
                    transactionCancellationToken);

                if (user is null || !user.Ativo)
                {
                    passwordHashService.PerformDummyVerification(currentPassword!);
                    return AuthenticatedPasswordChangeResult.Unauthorized();
                }

                var currentVerification = passwordHashService.Verify(
                    user.SenhaHash,
                    currentPassword!);
                if (currentVerification == PasswordHashVerificationResult.Failed)
                {
                    return AuthenticatedPasswordChangeResult.InvalidCurrentPassword();
                }

                if (passwordHashService.Verify(user.SenhaHash, newPassword!) !=
                    PasswordHashVerificationResult.Failed)
                {
                    return AuthenticatedPasswordChangeResult.Validation(
                        new Dictionary<string, string[]>
                        {
                            ["newPassword"] =
                            ["A nova senha deve ser diferente da senha atual."]
                        });
                }

                var now = timeProvider.GetUtcNow().UtcDateTime;
                var previousCredentialVersion = user.VersaoCredencial;
                user.TrocarSenhaHash(passwordHashService.Hash(newPassword!), now);

                var sessions = await store.FindSessionsForUpdateAsync(
                    userId,
                    transactionCancellationToken);
                foreach (var session in sessions)
                {
                    session.Revogar(now, MotivoRevogacaoSessao.SenhaAlterada);
                }

                await store.SaveChangesAsync(
                    new AuthenticatedPasswordChangeAudit(
                        userId,
                        previousCredentialVersion,
                        user.VersaoCredencial,
                        now),
                    transactionCancellationToken);

                return AuthenticatedPasswordChangeResult.Success();
            },
            cancellationToken);
    }

    private static Dictionary<string, string[]> Validate(
        int userId,
        string? currentPassword,
        string? newPassword)
    {
        var errors = new Dictionary<string, string[]>();

        if (userId <= 0)
        {
            errors["user"] = ["Usuário autenticado inválido."];
        }

        if (string.IsNullOrWhiteSpace(currentPassword) || currentPassword.Length > 1024)
        {
            errors["currentPassword"] = ["A senha atual é obrigatória."];
        }

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length is < 12 or > 128)
        {
            errors["newPassword"] = ["A nova senha deve possuir entre 12 e 128 caracteres."];
        }
        else if (string.Equals(currentPassword, newPassword, StringComparison.Ordinal))
        {
            errors["newPassword"] = ["A nova senha deve ser diferente da senha atual."];
        }

        return errors;
    }
}

public enum AuthenticatedPasswordChangeStatus
{
    Success = 1,
    Validation = 2,
    InvalidCurrentPassword = 3,
    Unauthorized = 4
}

public sealed record AuthenticatedPasswordChangeResult(
    AuthenticatedPasswordChangeStatus Status,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public static AuthenticatedPasswordChangeResult Success() =>
        new(AuthenticatedPasswordChangeStatus.Success, EmptyErrors);

    public static AuthenticatedPasswordChangeResult Validation(
        IReadOnlyDictionary<string, string[]> errors) =>
        new(AuthenticatedPasswordChangeStatus.Validation, errors);

    public static AuthenticatedPasswordChangeResult InvalidCurrentPassword() =>
        new(
            AuthenticatedPasswordChangeStatus.InvalidCurrentPassword,
            new Dictionary<string, string[]>
            {
                ["currentPassword"] = ["Não foi possível confirmar a senha atual."]
            });

    public static AuthenticatedPasswordChangeResult Unauthorized() =>
        new(AuthenticatedPasswordChangeStatus.Unauthorized, EmptyErrors);

    private static readonly IReadOnlyDictionary<string, string[]> EmptyErrors =
        new Dictionary<string, string[]>();
}
