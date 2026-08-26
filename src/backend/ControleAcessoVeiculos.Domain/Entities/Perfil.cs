namespace ControleAcessoVeiculos.Domain.Entities;

public class Perfil
{
    private Perfil()
    {
    }

    public Perfil(string nome, string? descricao = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nome);

        Nome = nome;
        Descricao = descricao;
        Ativo = true;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public string Nome { get; private set; } = null!;
    public string? Descricao { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }
}
