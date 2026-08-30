namespace ControleAcessoVeiculos.Domain.Entities;

public class AutorizacaoVeiculoEvento
{
    private AutorizacaoVeiculoEvento()
    {
    }

    public AutorizacaoVeiculoEvento(
        int eventoAcessoId,
        string tipoVeiculo,
        int quantidade,
        string? placa = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(eventoAcessoId);
        ArgumentException.ThrowIfNullOrWhiteSpace(tipoVeiculo);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantidade);

        if (tipoVeiculo.Length > 50)
        {
            throw new ArgumentOutOfRangeException(nameof(tipoVeiculo));
        }

        if (placa?.Length > 10)
        {
            throw new ArgumentOutOfRangeException(nameof(placa));
        }

        if (placa is not null && quantidade != 1)
        {
            throw new ArgumentException(
                "Uma autorização vinculada a uma placa deve representar um veículo.",
                nameof(quantidade));
        }

        EventoAcessoId = eventoAcessoId;
        TipoVeiculo = tipoVeiculo;
        Quantidade = quantidade;
        Placa = placa;
    }

    public int Id { get; private set; }
    public int EventoAcessoId { get; private set; }
    public string TipoVeiculo { get; private set; } = null!;
    public int Quantidade { get; private set; }
    public string? Placa { get; private set; }
}
