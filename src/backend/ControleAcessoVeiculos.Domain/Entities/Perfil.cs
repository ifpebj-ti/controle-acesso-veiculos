namespace ControleAcessoVeiculos.Domain.Entities;

public class Perfil
{
    private Perfil()
    {
    }

    public Perfil(string nome, string descricao)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nome);
        ArgumentException.ThrowIfNullOrWhiteSpace(descricao);

        Nome = nome;
        Descricao = descricao;
        Ativo = true;
    }

    public int Id { get; private set; }
    public string Nome { get; private set; } = null!;
    public string Descricao { get; private set; } = null!;
    public bool Ativo { get; private set; }
}
