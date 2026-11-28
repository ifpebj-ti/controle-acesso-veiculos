namespace ControleAcessoVeiculos.Domain.Entities;

public sealed class IncidenteContingencia
{
    private IncidenteContingencia() { }

    public IncidenteContingencia(Guid id, string referenciaPapel, DateTime inicioUtc,
        DateTime fimUtc, int criadoPorId, DateTime criadoEmUtc)
    {
        if (id == Guid.Empty) throw new ArgumentException("Informe o incidente.", nameof(id));
        ArgumentException.ThrowIfNullOrWhiteSpace(referenciaPapel);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(criadoPorId);
        if (referenciaPapel.Trim().Length is < 3 or > 120 || referenciaPapel.Any(char.IsControl))
            throw new ArgumentException("Informe uma referência de papel válida.", nameof(referenciaPapel));
        if (inicioUtc == default || fimUtc == default || criadoEmUtc == default ||
            inicioUtc.Kind != DateTimeKind.Utc || fimUtc.Kind != DateTimeKind.Utc ||
            criadoEmUtc.Kind != DateTimeKind.Utc || fimUtc < inicioUtc || fimUtc > criadoEmUtc)
            throw new ArgumentException("Informe o período observado em UTC, sem horário futuro.");
        ChaveIncidente = id;
        ReferenciaPapel = referenciaPapel.Trim();
        InicioUtc = inicioUtc;
        FimUtc = fimUtc;
        CriadoPorId = criadoPorId;
        CriadoEmUtc = criadoEmUtc;
    }

    public int Id { get; private set; }
    public Guid ChaveIncidente { get; private set; }
    public string ReferenciaPapel { get; private set; } = null!;
    public DateTime InicioUtc { get; private set; }
    public DateTime FimUtc { get; private set; }
    public int CriadoPorId { get; private set; }
    public DateTime CriadoEmUtc { get; private set; }

    public bool Contem(DateTime entradaUtc, DateTime? saidaUtc) =>
        entradaUtc >= InicioUtc && entradaUtc <= FimUtc &&
        (!saidaUtc.HasValue || saidaUtc.Value >= entradaUtc && saidaUtc.Value <= FimUtc);
}
