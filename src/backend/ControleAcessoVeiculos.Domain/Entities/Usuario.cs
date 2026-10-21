using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Entities;

public class Usuario
{
    private Usuario()
    {
    }

    public Usuario(
        string email,
        string? senhaHash,
        int pessoaId,
        int perfilId,
        bool trocaSenhaObrigatoria = false,
        DateTime? credencialTemporariaExpiraEm = null,
        DateTime? credencialTemporariaUtilizadaEm = null,
        MetodoAutenticacao metodoAutenticacao = MetodoAutenticacao.Local)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pessoaId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(perfilId);

        if (metodoAutenticacao == MetodoAutenticacao.Local)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(senhaHash);
        }
        else if (senhaHash is not null)
        {
            throw new ArgumentException(
                "Uma conta Google não pode possuir senha local.",
                nameof(senhaHash));
        }

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
        MetodoAutenticacao = metodoAutenticacao;
        DataCriacao = DateTime.UtcNow;
    }

    public int Id { get; private set; }
    public string Email { get; private set; } = null!;
    public string? SenhaHash { get; private set; }
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
    public string? GoogleSubject { get; private set; }
    public DateTime? GoogleVinculadoEm { get; private set; }
    public MetodoAutenticacao MetodoAutenticacao { get; private set; }

    public bool PodeAutenticar(DateTime agoraUtc) =>
        Ativo &&
        (!BloqueadoAte.HasValue || BloqueadoAte <= agoraUtc) &&
        (!TrocaSenhaObrigatoria ||
         (CredencialTemporariaExpiraEm > agoraUtc &&
          !CredencialTemporariaUtilizadaEm.HasValue));

    public bool PodeAutenticarComSenha(DateTime agoraUtc) =>
        MetodoAutenticacao == MetodoAutenticacao.Local &&
        SenhaHash is not null &&
        GoogleSubject is null &&
        PodeAutenticar(agoraUtc);

    public bool PodeAutenticarComGoogle(DateTime agoraUtc) =>
        MetodoAutenticacao == MetodoAutenticacao.Google &&
        PodeAutenticar(agoraUtc);

    public void VincularIdentidadeGoogle(string subject, DateTime agoraUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(subject);

        var normalizedSubject = subject.Trim();
        if (normalizedSubject.Length > 255)
        {
            throw new ArgumentOutOfRangeException(nameof(subject));
        }

        if (GoogleSubject is not null)
        {
            if (string.Equals(GoogleSubject, normalizedSubject, StringComparison.Ordinal))
            {
                return;
            }

            throw new InvalidOperationException(
                "A conta jÃ¡ possui uma identidade Google diferente.");
        }

        MetodoAutenticacao = MetodoAutenticacao.Google;
        SenhaHash = null;
        GoogleSubject = normalizedSubject;
        GoogleVinculadoEm = agoraUtc;
        VersaoCredencial = checked(VersaoCredencial + 1);
        TrocaSenhaObrigatoria = false;
        CredencialTemporariaExpiraEm = null;
        CredencialTemporariaUtilizadaEm = null;
        TentativasFalhas = 0;
        BloqueadoAte = null;
        DataAlteracao = agoraUtc;
    }

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

        if (MetodoAutenticacao != MetodoAutenticacao.Local)
        {
            throw new InvalidOperationException(
                "Uma conta Google não pode possuir senha local.");
        }

        SenhaHash = senhaHash;
        DataAlteracao = agoraUtc;
    }

    public void TrocarSenhaHash(string senhaHash, DateTime agoraUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(senhaHash);

        if (MetodoAutenticacao != MetodoAutenticacao.Local)
        {
            throw new InvalidOperationException(
                "Uma conta Google não pode possuir senha local.");
        }

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

        if (MetodoAutenticacao != MetodoAutenticacao.Local)
        {
            throw new InvalidOperationException(
                "Uma conta Google não pode receber credencial local.");
        }

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
