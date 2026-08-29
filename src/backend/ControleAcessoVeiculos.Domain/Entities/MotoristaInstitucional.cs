namespace ControleAcessoVeiculos.Domain.Entities;

public class MotoristaInstitucional
{
    private MotoristaInstitucional()
    {
    }

    public MotoristaInstitucional(
        int pessoaId,
        int criadoPorId,
        DateTime dataCriacao)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pessoaId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(criadoPorId);

        if (dataCriacao == default)
        {
            throw new ArgumentOutOfRangeException(nameof(dataCriacao));
        }

        PessoaId = pessoaId;
        CriadoPorId = criadoPorId;
        Ativo = true;
        DataCriacao = dataCriacao;
    }

    public int Id { get; private set; }
    public int PessoaId { get; private set; }
    public bool Ativo { get; private set; }
    public int CriadoPorId { get; private set; }
    public int? AtualizadoPorId { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }

    public void Desativar(DateTime dataAlteracao, int atualizadoPorId)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(atualizadoPorId);

        if (dataAlteracao < DataCriacao)
        {
            throw new ArgumentOutOfRangeException(nameof(dataAlteracao));
        }

        if (!Ativo)
        {
            throw new InvalidOperationException("A autorização já está inativa.");
        }

        Ativo = false;
        AtualizadoPorId = atualizadoPorId;
        DataAlteracao = dataAlteracao;
    }

    public void Reativar(DateTime dataAlteracao, int atualizadoPorId)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(atualizadoPorId);

        if (dataAlteracao < DataCriacao)
        {
            throw new ArgumentOutOfRangeException(nameof(dataAlteracao));
        }

        if (Ativo)
        {
            throw new InvalidOperationException("A autorização já está ativa.");
        }

        Ativo = true;
        AtualizadoPorId = atualizadoPorId;
        DataAlteracao = dataAlteracao;
    }
}
