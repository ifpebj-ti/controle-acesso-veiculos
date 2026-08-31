namespace ControleAcessoVeiculos.API.Observability;

public sealed class ObservabilityOptions
{
    public const string SectionName = "Observability";
    public const string DefaultServiceName = "controle-acesso-veiculos-api";

    public bool Enabled { get; init; }
    public string ServiceName { get; init; } = DefaultServiceName;

    public void Validate()
    {
        if (!Enabled)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(ServiceName) || ServiceName.Length > 100)
        {
            throw new InvalidOperationException(
                "Observability:ServiceName deve conter entre 1 e 100 caracteres quando a observabilidade estiver habilitada.");
        }
    }
}
