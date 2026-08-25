using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Entities;

public class RegistroAcesso
{
    private RegistroAcesso()
    {
    }

    public RegistroAcesso(
        int veiculoId,
        int categoriaAcessoId,
        DateTime dataHoraEntrada,
        StatusRegistroAcesso status,
        string? observacao = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(veiculoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(categoriaAcessoId);

        VeiculoId = veiculoId;
        CategoriaAcessoId = categoriaAcessoId;
        DataHoraEntrada = dataHoraEntrada;
        Status = status;
        Observacao = observacao;
    }

    public int Id { get; private set; }
    public int VeiculoId { get; private set; }
    public int CategoriaAcessoId { get; private set; }
    public DateTime DataHoraEntrada { get; private set; }
    public DateTime? DataHoraSaida { get; private set; }
    public StatusRegistroAcesso Status { get; private set; }
    public string? Observacao { get; private set; }
}
