using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Entities;

/// <summary>Immutable paper provenance with a separate, asynchronous review state.</summary>
public sealed class ReconciliacaoContingencia
{
    public ReconciliacaoContingencia(
        Guid incidenteId,
        int numeroLinha,
        int registroAcessoId,
        string referenciaAutorPapel,
        int digitadoPorId,
        DateTime entradaObservadaUtc,
        DateTime? saidaObservadaNoPapelUtc,
        DateTime digitadoEmUtc,
        string justificativa)
    {
        if (incidenteId == Guid.Empty) throw new ArgumentException("Informe o incidente.", nameof(incidenteId));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(numeroLinha);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(registroAcessoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(digitadoPorId);
        ValidateUtc(entradaObservadaUtc, nameof(entradaObservadaUtc));
        ValidateUtc(digitadoEmUtc, nameof(digitadoEmUtc));
        if (entradaObservadaUtc > digitadoEmUtc)
            throw new ArgumentException("A entrada observada não pode ser posterior à digitação.", nameof(entradaObservadaUtc));
        if (saidaObservadaNoPapelUtc.HasValue)
        {
            ValidateUtc(saidaObservadaNoPapelUtc.Value, nameof(saidaObservadaNoPapelUtc));
            if (saidaObservadaNoPapelUtc < entradaObservadaUtc || saidaObservadaNoPapelUtc > digitadoEmUtc)
                throw new ArgumentException("A saída observada deve estar entre a entrada e a digitação.", nameof(saidaObservadaNoPapelUtc));
        }

        IncidenteId = incidenteId;
        NumeroLinha = numeroLinha;
        RegistroAcessoId = registroAcessoId;
        ReferenciaAutorPapel = Normalize(referenciaAutorPapel, 1, 120, nameof(referenciaAutorPapel));
        DigitadoPorId = digitadoPorId;
        EntradaObservadaUtc = entradaObservadaUtc;
        SaidaObservadaNoPapelUtc = saidaObservadaNoPapelUtc;
        DigitadoEmUtc = digitadoEmUtc;
        Justificativa = Normalize(justificativa, 10, 500, nameof(justificativa));
    }

    public Guid IncidenteId { get; }
    public int NumeroLinha { get; }
    public int RegistroAcessoId { get; }
    public string ReferenciaAutorPapel { get; }
    public int DigitadoPorId { get; }
    public DateTime EntradaObservadaUtc { get; }
    public DateTime? SaidaObservadaNoPapelUtc { get; }
    public DateTime DigitadoEmUtc { get; }
    public string Justificativa { get; }
    public StatusConferenciaContingencia Status { get; private set; } = StatusConferenciaContingencia.Pendente;
    public int? ConferidoPorId { get; private set; }
    public DateTime? ConferidoEmUtc { get; private set; }
    public string? MotivoConferencia { get; private set; }

    /// <returns>False only for the same terminal decision, actor and reason.</returns>
    public bool Conferir(bool aceitar, int conferidoPorId, string motivo, DateTime conferidoEmUtc)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(conferidoPorId);
        if (conferidoPorId == DigitadoPorId)
            throw new InvalidOperationException("A conferência exige outra pessoa.");
        ValidateUtc(conferidoEmUtc, nameof(conferidoEmUtc));
        if (conferidoEmUtc < DigitadoEmUtc)
            throw new ArgumentException("A conferência não pode anteceder a digitação.", nameof(conferidoEmUtc));
        var normalizedReason = Normalize(motivo, 10, 500, nameof(motivo));
        var target = aceitar ? StatusConferenciaContingencia.Conferida : StatusConferenciaContingencia.Recusada;
        if (Status != StatusConferenciaContingencia.Pendente)
        {
            if (Status == target && ConferidoPorId == conferidoPorId && MotivoConferencia == normalizedReason)
                return false;
            throw new InvalidOperationException("A decisão já registrada não pode ser sobrescrita.");
        }

        Status = target;
        ConferidoPorId = conferidoPorId;
        ConferidoEmUtc = conferidoEmUtc;
        MotivoConferencia = normalizedReason;
        return true;
    }

    private static string Normalize(string value, int minimum, int maximum, string parameter)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value, parameter);
        var normalized = value.Trim();
        if (normalized.Length < minimum || normalized.Length > maximum)
            throw new ArgumentException($"Informe de {minimum} a {maximum} caracteres.", parameter);
        return normalized;
    }

    private static void ValidateUtc(DateTime value, string parameter)
    {
        if (value == default || value.Kind != DateTimeKind.Utc)
            throw new ArgumentException("Informe uma data UTC válida.", parameter);
    }
}
