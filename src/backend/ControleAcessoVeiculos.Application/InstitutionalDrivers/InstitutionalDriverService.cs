namespace ControleAcessoVeiculos.Application.InstitutionalDrivers;

public sealed class InstitutionalDriverService(
    IInstitutionalDriverStore store,
    TimeProvider timeProvider)
{
    public async Task<AuthorizeInstitutionalDriverResult> AuthorizeAsync(
        AuthorizeInstitutionalDriverCommand command,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        var errors = Validate(command);

        if (errors.Count > 0)
        {
            return AuthorizeInstitutionalDriverResult.Invalid(errors);
        }

        var driver = new InstitutionalDriverData(
            command.Name!.Trim(),
            NormalizeOptional(command.DocumentType)?.ToUpperInvariant(),
            NormalizeOptional(command.DocumentNumber));
        var stored = await store.TryAuthorizeAsync(
            driver,
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        return stored.Status == InstitutionalDriverStoreAuthorizationStatus.Success
            ? AuthorizeInstitutionalDriverResult.Success(stored.Driver!)
            : AuthorizeInstitutionalDriverResult.Conflict();
    }

    public Task<IReadOnlyList<InstitutionalDriverRecord>> ListActiveAsync(
        CancellationToken cancellationToken = default) =>
        store.ListActiveAsync(cancellationToken);

    public Task<DeactivateInstitutionalDriverResult> DeactivateAsync(
        int driverId,
        int actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(driverId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(actorUserId);

        return store.TryDeactivateAsync(
            driverId,
            actorUserId,
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);
    }

    private static Dictionary<string, string[]> Validate(
        AuthorizeInstitutionalDriverCommand command)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(command.Name) || command.Name.Trim().Length > 200)
        {
            errors["name"] = ["O nome é obrigatório e deve possuir até 200 caracteres."];
        }

        var hasDocumentType = !string.IsNullOrWhiteSpace(command.DocumentType);
        var hasDocumentNumber = !string.IsNullOrWhiteSpace(command.DocumentNumber);

        if (hasDocumentType != hasDocumentNumber ||
            command.DocumentType?.Trim().Length > 10 ||
            command.DocumentNumber?.Trim().Length > 20)
        {
            errors["document"] =
                ["Tipo e número do documento devem ser informados juntos e respeitar os limites de 10 e 20 caracteres."];
        }

        return errors;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
