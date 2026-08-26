namespace ControleAcessoVeiculos.Domain.Entities;

public class CategoriaAcesso
{
    private CategoriaAcesso()
    {
    }

    public CategoriaAcesso(
        string nome,
        string? descricao = null,
        int? tempoValidadeDias = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nome);

        if (tempoValidadeDias is < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tempoValidadeDias));
        }

        Nome = nome;
        Descricao = descricao;
        TempoValidadeDias = tempoValidadeDias;
        Ativo = true;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public string Nome { get; private set; } = null!;
    public string? Descricao { get; private set; }
    public int? TempoValidadeDias { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }
}
