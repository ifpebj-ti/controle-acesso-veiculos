using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Entities;

public class UsoVeiculoInstitucional
{
    private UsoVeiculoInstitucional()
    {
    }

    public UsoVeiculoInstitucional(
        int veiculoId,
        int motoristaId,
        DateTime dataHoraSaida,
        int quilometragemSaida,
        string itinerario,
        int criadoPorId,
        int? registroAcessoId = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(veiculoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(motoristaId);
        ArgumentOutOfRangeException.ThrowIfNegative(quilometragemSaida);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(criadoPorId);
        ArgumentException.ThrowIfNullOrWhiteSpace(itinerario);

        if (registroAcessoId is <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(registroAcessoId));
        }

        VeiculoId = veiculoId;
        MotoristaId = motoristaId;
        RegistroAcessoId = registroAcessoId;
        DataHoraSaida = dataHoraSaida;
        QuilometragemSaida = quilometragemSaida;
        Itinerario = itinerario;
        CriadoPorId = criadoPorId;
        Status = StatusUsoVeiculoInstitucional.EmUso;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public int VeiculoId { get; private set; }
    public int MotoristaId { get; private set; }
    public int? RegistroAcessoId { get; private set; }
    public DateTime DataHoraSaida { get; private set; }
    public int QuilometragemSaida { get; private set; }
    public string Itinerario { get; private set; } = null!;
    public DateTime? DataHoraEntrada { get; private set; }
    public int? QuilometragemEntrada { get; private set; }
    public StatusUsoVeiculoInstitucional Status { get; private set; }
    public int CriadoPorId { get; private set; }
    public int? AtualizadoPorId { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }

    public void RegistrarRetorno(
        DateTime dataHoraEntrada,
        int quilometragemEntrada,
        int atualizadoPorId)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(quilometragemEntrada);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(atualizadoPorId);

        if (Status == StatusUsoVeiculoInstitucional.Concluido)
        {
            throw new InvalidOperationException("O uso institucional já foi concluído.");
        }

        if (dataHoraEntrada < DataHoraSaida)
        {
            throw new ArgumentException(
                "A data e hora de retorno não pode ser anterior à saída.",
                nameof(dataHoraEntrada));
        }

        if (quilometragemEntrada < QuilometragemSaida)
        {
            throw new ArgumentException(
                "A quilometragem de retorno não pode ser inferior à de saída.",
                nameof(quilometragemEntrada));
        }

        DataHoraEntrada = dataHoraEntrada;
        QuilometragemEntrada = quilometragemEntrada;
        AtualizadoPorId = atualizadoPorId;
        Status = StatusUsoVeiculoInstitucional.Concluido;
        DataAlteracao = DateTime.UtcNow;
    }

    public void MarcarRetornoPendente(int atualizadoPorId)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(atualizadoPorId);

        AtualizadoPorId = atualizadoPorId;
        Status = StatusUsoVeiculoInstitucional.PendenteRetorno;
        DataAlteracao = DateTime.UtcNow;
    }
}
