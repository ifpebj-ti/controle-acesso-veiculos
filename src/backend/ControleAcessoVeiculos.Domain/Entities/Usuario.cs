namespace ControleAcessoVeiculos.Domain.Entities;

public class Usuario
{
    private Usuario()
    {
    }

    public Usuario(string email, string senhaHash, int pessoaId, int perfilId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(senhaHash);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pessoaId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(perfilId);

        Email = email;
        SenhaHash = senhaHash;
        PessoaId = pessoaId;
        PerfilId = perfilId;
        Ativo = true;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public string Email { get; private set; } = null!;
    public string SenhaHash { get; private set; } = null!;
    public int PessoaId { get; private set; }
    public int PerfilId { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public DateTime? DataAlteracao { get; private set; }
}
