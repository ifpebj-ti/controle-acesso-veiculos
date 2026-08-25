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
        string tabela,
        int registroId,
        int usuarioId,
        string detalhes)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tabela);
        ArgumentException.ThrowIfNullOrWhiteSpace(detalhes);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(registroId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(usuarioId);

        DataHora = dataHora;
        TipoAcao = tipoAcao;
        Tabela = tabela;
        RegistroId = registroId;
        UsuarioId = usuarioId;
        Detalhes = detalhes;
    }

    public int Id { get; private set; }
    public DateTime DataHora { get; private set; }
    public TipoAcaoAuditoria TipoAcao { get; private set; }
    public string Tabela { get; private set; } = null!;
    public int RegistroId { get; private set; }
    public int UsuarioId { get; private set; }
    public string Detalhes { get; private set; } = null!;
}
