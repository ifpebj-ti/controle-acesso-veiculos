namespace ControleAcessoVeiculos.Domain.Entities;

public class CategoriaAcesso
{
    private CategoriaAcesso()
    {
    }

    public CategoriaAcesso(string nome, string descricao, int tempoValidadeDias)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nome);
        ArgumentException.ThrowIfNullOrWhiteSpace(descricao);
        ArgumentOutOfRangeException.ThrowIfNegative(tempoValidadeDias);

        Nome = nome;
        Descricao = descricao;
        TempoValidadeDias = tempoValidadeDias;
        Ativo = true;
    }

    public int Id { get; private set; }
    public string Nome { get; private set; } = null!;
    public string Descricao { get; private set; } = null!;
    public int TempoValidadeDias { get; private set; }
    public bool Ativo { get; private set; }
}
