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

        Email = NormalizarEmail(email);
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
    public int TentativasFalhas { get; private set; }
    public DateTime? BloqueadoAte { get; private set; }

    public bool PodeAutenticar(DateTime agoraUtc) =>
        Ativo && (!BloqueadoAte.HasValue || BloqueadoAte <= agoraUtc);

    public void RegistrarTentativaFalha(
        DateTime agoraUtc,
        int limiteTentativas,
        TimeSpan duracaoBloqueio)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(limiteTentativas);

        if (duracaoBloqueio <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(duracaoBloqueio));
        }

        if (BloqueadoAte.HasValue && BloqueadoAte <= agoraUtc)
        {
            TentativasFalhas = 0;
            BloqueadoAte = null;
        }

        TentativasFalhas++;

        if (TentativasFalhas >= limiteTentativas)
        {
            BloqueadoAte = agoraUtc.Add(duracaoBloqueio);
        }

        DataAlteracao = agoraUtc;
    }

    public void RegistrarAutenticacaoBemSucedida(DateTime agoraUtc)
    {
        TentativasFalhas = 0;
        BloqueadoAte = null;
        DataAlteracao = agoraUtc;
    }

    public void Desativar(DateTime agoraUtc)
    {
        Ativo = false;
        DataAlteracao = agoraUtc;
    }

    public static string NormalizarEmail(string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        return email.Trim().ToLowerInvariant();
    }
}
