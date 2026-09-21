namespace ControleAcessoVeiculos.Application.Accounts;

public interface ITemporaryCredentialGenerator
{
    string Create();
}

public sealed record TemporaryCredentialPolicy(TimeSpan Lifetime)
{
    public TemporaryCredentialPolicy Validate()
    {
        if (Lifetime < TimeSpan.FromMinutes(5) || Lifetime > TimeSpan.FromHours(24))
        {
            throw new InvalidOperationException(
                "A credencial temporária deve expirar entre 5 minutos e 24 horas.");
        }

        return this;
    }
}
