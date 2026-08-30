using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Entities;

public class RegistroAcesso
{
    private RegistroAcesso()
    {
    }

    public RegistroAcesso(
        int veiculoId,
        int pessoaId,
        int categoriaAcessoId,
        DateTime dataHoraEntrada,
        string objetivo,
        int criadoPorId,
        string? observacao = null,
        int? autorizacaoVeiculoEventoId = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(veiculoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pessoaId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(categoriaAcessoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(criadoPorId);
        ArgumentException.ThrowIfNullOrWhiteSpace(objetivo);

        if (autorizacaoVeiculoEventoId is <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(autorizacaoVeiculoEventoId));
        }

        VeiculoId = veiculoId;
        PessoaId = pessoaId;
        CategoriaAcessoId = categoriaAcessoId;
        DataHoraEntrada = dataHoraEntrada;
        Objetivo = objetivo;
        CriadoPorId = criadoPorId;
        Status = StatusRegistroAcesso.Aberto;
        Observacao = observacao;
        AutorizacaoVeiculoEventoId = autorizacaoVeiculoEventoId;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public int VeiculoId { get; private set; }
    public int PessoaId { get; private set; }
    public int CategoriaAcessoId { get; private set; }
    public int? AutorizacaoVeiculoEventoId { get; private set; }
    public DateTime DataHoraEntrada { get; private set; }
    public DateTime? DataHoraSaida { get; private set; }
    public string Objetivo { get; private set; } = null!;
    public StatusRegistroAcesso Status { get; private set; }
    public int CriadoPorId { get; private set; }
    public int? AtualizadoPorId { get; private set; }
    public string? Observacao { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }

    public void RegistrarSaida(DateTime dataHoraSaida, int atualizadoPorId)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(atualizadoPorId);

        if (Status == StatusRegistroAcesso.Encerrado)
        {
            throw new InvalidOperationException("O registro de acesso já está encerrado.");
        }

        if (dataHoraSaida < DataHoraEntrada)
        {
            throw new ArgumentException(
                "A data e hora de saída não pode ser anterior à entrada.",
                nameof(dataHoraSaida));
        }

        DataHoraSaida = dataHoraSaida;
        AtualizadoPorId = atualizadoPorId;
        Status = StatusRegistroAcesso.Encerrado;
        DataAlteracao = DateTime.UtcNow;
    }

    public void MarcarComoPendente(int atualizadoPorId)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(atualizadoPorId);

        AtualizadoPorId = atualizadoPorId;
        Status = StatusRegistroAcesso.Pendente;
        DataAlteracao = DateTime.UtcNow;
    }

    public bool CorrigirDados(
        int categoriaAcessoId,
        string objetivo,
        string? observacao,
        int atualizadoPorId,
        DateTime dataAlteracao)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(categoriaAcessoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(atualizadoPorId);
        ArgumentException.ThrowIfNullOrWhiteSpace(objetivo);

        if (dataAlteracao == default || dataAlteracao < DataCriacao)
        {
            throw new ArgumentOutOfRangeException(nameof(dataAlteracao));
        }

        var normalizedObjective = objetivo.Trim();
        var normalizedObservation = string.IsNullOrWhiteSpace(observacao)
            ? null
            : observacao.Trim();
        var changed = CategoriaAcessoId != categoriaAcessoId ||
            Objetivo != normalizedObjective ||
            Observacao != normalizedObservation;

        if (!changed)
        {
            return false;
        }

        CategoriaAcessoId = categoriaAcessoId;
        Objetivo = normalizedObjective;
        Observacao = normalizedObservation;
        AtualizadoPorId = atualizadoPorId;
        DataAlteracao = dataAlteracao;
        return true;
    }
}
