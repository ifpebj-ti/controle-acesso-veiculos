namespace ControleAcessoVeiculos.Domain.Entities;

public class Usuario
{
    private Usuario()
    {
    }

    public Usuario(
        string email,
        string senhaHash,
        int pessoaId,
        int perfilId,
        bool trocaSenhaObrigatoria = false,
        DateTime? credencialTemporariaExpiraEm = null,
        DateTime? credencialTemporariaUtilizadaEm = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(senhaHash);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pessoaId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(perfilId);

        if (trocaSenhaObrigatoria != credencialTemporariaExpiraEm.HasValue)
        {
            throw new ArgumentException(
                "A expiração deve existir somente para credencial temporária.");
        }

        if (!trocaSenhaObrigatoria && credencialTemporariaUtilizadaEm.HasValue)
        {
            throw new ArgumentException(
                "Uma credencial permanente não pode estar marcada como utilizada.");
        }

        Email = NormalizarEmail(email);
        SenhaHash = senhaHash;
        PessoaId = pessoaId;
        PerfilId = perfilId;
        Ativo = true;
        VersaoCredencial = 1;
        TrocaSenhaObrigatoria = trocaSenhaObrigatoria;
        CredencialTemporariaExpiraEm = credencialTemporariaExpiraEm;
        CredencialTemporariaUtilizadaEm = credencialTemporariaUtilizadaEm;
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
    public int VersaoCredencial { get; private set; }
    public bool TrocaSenhaObrigatoria { get; private set; }
    public DateTime? CredencialTemporariaExpiraEm { get; private set; }
    public DateTime? CredencialTemporariaUtilizadaEm { get; private set; }

    public bool PodeAutenticar(DateTime agoraUtc) =>
        Ativo &&
        (!BloqueadoAte.HasValue || BloqueadoAte <= agoraUtc) &&
        (!TrocaSenhaObrigatoria ||
         (CredencialTemporariaExpiraEm > agoraUtc &&
          !CredencialTemporariaUtilizadaEm.HasValue));

    public void ConsumirCredencialTemporaria(DateTime agoraUtc)
    {
        if (!TrocaSenhaObrigatoria ||
            CredencialTemporariaExpiraEm <= agoraUtc ||
            CredencialTemporariaUtilizadaEm.HasValue)
        {
            throw new InvalidOperationException(
                "A credencial temporária não está disponível para uso.");
        }

        CredencialTemporariaUtilizadaEm = agoraUtc;
        DataAlteracao = agoraUtc;
    }

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

    public void AtualizarSenhaHash(string senhaHash, DateTime agoraUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(senhaHash);

        SenhaHash = senhaHash;
        DataAlteracao = agoraUtc;
    }

    public void TrocarSenhaHash(string senhaHash, DateTime agoraUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(senhaHash);

        SenhaHash = senhaHash;
        VersaoCredencial = checked(VersaoCredencial + 1);
        TentativasFalhas = 0;
        BloqueadoAte = null;
        TrocaSenhaObrigatoria = false;
        CredencialTemporariaExpiraEm = null;
        CredencialTemporariaUtilizadaEm = null;
        DataAlteracao = agoraUtc;
    }

    public void DefinirCredencialTemporaria(
        string senhaHash,
        DateTime expiraEmUtc,
        DateTime agoraUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(senhaHash);

        if (expiraEmUtc <= agoraUtc)
        {
            throw new ArgumentOutOfRangeException(nameof(expiraEmUtc));
        }

        SenhaHash = senhaHash;
        VersaoCredencial = checked(VersaoCredencial + 1);
        TrocaSenhaObrigatoria = true;
        CredencialTemporariaExpiraEm = expiraEmUtc;
        CredencialTemporariaUtilizadaEm = null;
        TentativasFalhas = 0;
        BloqueadoAte = null;
        DataAlteracao = agoraUtc;
    }

    public void Desativar(DateTime agoraUtc)
    {
        Ativo = false;
        DataAlteracao = agoraUtc;
    }

    public void Reativar(DateTime agoraUtc)
    {
        Ativo = true;
        TentativasFalhas = 0;
        BloqueadoAte = null;
        DataAlteracao = agoraUtc;
    }

    public static string NormalizarEmail(string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        return email.Trim().ToLowerInvariant();
    }
}
