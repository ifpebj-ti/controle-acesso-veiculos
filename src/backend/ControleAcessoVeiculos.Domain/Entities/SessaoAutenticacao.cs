using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Entities;

public class SessaoAutenticacao
{
    private SessaoAutenticacao()
    {
    }

    public SessaoAutenticacao(
        int usuarioId,
        Guid familiaId,
        string tokenHash,
        DateTime criadaEmUtc,
        DateTime expiraEmUtc)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(usuarioId);

        if (familiaId == Guid.Empty)
        {
            throw new ArgumentException(
                "A familia da sessao deve possuir um identificador.",
                nameof(familiaId));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(tokenHash);

        if (expiraEmUtc <= criadaEmUtc)
        {
            throw new ArgumentOutOfRangeException(
                nameof(expiraEmUtc),
                "A expiracao absoluta deve ser posterior a criacao da sessao.");
        }

        UsuarioId = usuarioId;
        FamiliaId = familiaId;
        TokenHash = tokenHash;
        CriadaEm = criadaEmUtc;
        UltimaAtividadeEm = criadaEmUtc;
        ExpiraEm = expiraEmUtc;
    }

    public int Id { get; private set; }
    public int UsuarioId { get; private set; }
    public Guid FamiliaId { get; private set; }
    public string TokenHash { get; private set; } = null!;
    public string? TokenSubstitutoHash { get; private set; }
    public DateTime CriadaEm { get; private set; }
    public DateTime UltimaAtividadeEm { get; private set; }
    public DateTime ExpiraEm { get; private set; }
    public DateTime? ConsumidaEm { get; private set; }
    public DateTime? RevogadaEm { get; private set; }
    public MotivoRevogacaoSessao? MotivoRevogacao { get; private set; }

    public bool FoiConsumida => ConsumidaEm.HasValue;
    public bool FoiRevogada => RevogadaEm.HasValue;

    public bool PodeSerRenovada(DateTime agoraUtc, TimeSpan limiteInatividade)
    {
        if (limiteInatividade <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(limiteInatividade));
        }

        return !FoiConsumida &&
            !FoiRevogada &&
            agoraUtc < ExpiraEm &&
            agoraUtc < UltimaAtividadeEm.Add(limiteInatividade);
    }

    public SessaoAutenticacao Rotacionar(
        string tokenSubstitutoHash,
        DateTime agoraUtc,
        TimeSpan limiteInatividade)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tokenSubstitutoHash);

        if (string.Equals(TokenHash, tokenSubstitutoHash, StringComparison.Ordinal))
        {
            throw new ArgumentException(
                "O token sucessor deve ser diferente do token atual.",
                nameof(tokenSubstitutoHash));
        }

        if (!PodeSerRenovada(agoraUtc, limiteInatividade))
        {
            throw new InvalidOperationException(
                "A sessao nao esta disponivel para renovacao.");
        }

        ConsumidaEm = agoraUtc;
        RevogadaEm = agoraUtc;
        MotivoRevogacao = MotivoRevogacaoSessao.Rotacao;
        TokenSubstitutoHash = tokenSubstitutoHash;

        return new SessaoAutenticacao(
            UsuarioId,
            FamiliaId,
            tokenSubstitutoHash,
            agoraUtc,
            ExpiraEm);
    }

    public void Revogar(DateTime agoraUtc, MotivoRevogacaoSessao motivo)
    {
        if (!Enum.IsDefined(motivo))
        {
            throw new ArgumentOutOfRangeException(nameof(motivo));
        }

        if (motivo == MotivoRevogacaoSessao.Rotacao)
        {
            throw new ArgumentException(
                "Rotacao exige a criacao de uma sessao sucessora.",
                nameof(motivo));
        }

        if (FoiRevogada)
        {
            return;
        }

        RevogadaEm = agoraUtc;
        MotivoRevogacao = motivo;
    }
}
