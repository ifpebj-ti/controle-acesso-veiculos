namespace ControleAcessoVeiculos.Domain.Entities;

public class PessoaVeiculo
{
    private PessoaVeiculo()
    {
    }

    public PessoaVeiculo(
        int pessoaId,
        int veiculoId,
        string tipoRelacao,
        DateOnly? dataInicio = null,
        DateOnly? dataFim = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pessoaId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(veiculoId);
        ArgumentException.ThrowIfNullOrWhiteSpace(tipoRelacao);

        if (dataFim < dataInicio)
        {
            throw new ArgumentException("A data final não pode ser anterior à data inicial.");
        }

        PessoaId = pessoaId;
        VeiculoId = veiculoId;
        TipoRelacao = tipoRelacao;
        DataInicio = dataInicio;
        DataFim = dataFim;
        Ativo = true;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public int PessoaId { get; private set; }
    public int VeiculoId { get; private set; }
    public string TipoRelacao { get; private set; } = null!;
    public bool Ativo { get; private set; }
    public DateOnly? DataInicio { get; private set; }
    public DateOnly? DataFim { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }
}
