namespace ControleAcessoVeiculos.Domain.Entities;

public class Pessoa
{
    private Pessoa()
    {
    }

    public Pessoa(string nome, string email, string documento)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nome);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(documento);

        Nome = nome;
        Email = email;
        Documento = documento;
        Ativo = true;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public string Nome { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string Documento { get; private set; } = null!;
    public bool Ativo { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }
}
