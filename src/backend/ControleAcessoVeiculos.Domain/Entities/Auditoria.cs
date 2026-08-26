using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Entities;

public class Auditoria
{
    private Auditoria()
    {
    }

    public Auditoria(
        DateTime dataHora,
        TipoAcaoAuditoria tipoAcao,
        string entidade,
        int registroId,
        int usuarioId,
        string? dadosAnteriores = null,
        string? dadosNovos = null,
        string? detalhes = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(entidade);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(registroId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(usuarioId);

        DataHora = dataHora;
        TipoAcao = tipoAcao;
        Entidade = entidade;
        RegistroId = registroId;
        UsuarioId = usuarioId;
        DadosAnteriores = dadosAnteriores;
        DadosNovos = dadosNovos;
        Detalhes = detalhes;
    }

    public int Id { get; private set; }
    public DateTime DataHora { get; private set; }
    public TipoAcaoAuditoria TipoAcao { get; private set; }
    public string Entidade { get; private set; } = null!;
    public int RegistroId { get; private set; }
    public int UsuarioId { get; private set; }
    public string? DadosAnteriores { get; private set; }
    public string? DadosNovos { get; private set; }
    public string? Detalhes { get; private set; }
}
