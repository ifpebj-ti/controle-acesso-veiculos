using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Entities;

public sealed class SolicitacaoCorrecaoAcesso
{
    public SolicitacaoCorrecaoAcesso(
        Guid chaveRequisicao,
        int registroAcessoId,
        int solicitadoPorId,
        ValoresDescritivosAcesso original,
        ValoresDescritivosAcesso proposto,
        string justificativa,
        DateTime solicitadoEmUtc)
    {
        if (chaveRequisicao == Guid.Empty)
        {
            throw new ArgumentException("A chave da solicitação é obrigatória.", nameof(chaveRequisicao));
        }

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(registroAcessoId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(solicitadoPorId);
        ArgumentNullException.ThrowIfNull(original);
        ArgumentNullException.ThrowIfNull(proposto);
        ValidateUtc(solicitadoEmUtc);
        justificativa = NormalizeReason(justificativa);
        if (original == proposto)
        {
            throw new ArgumentException("A proposta deve alterar algum dado descritivo.", nameof(proposto));
        }

        ChaveRequisicao = chaveRequisicao;
        RegistroAcessoId = registroAcessoId;
        SolicitadoPorId = solicitadoPorId;
        Original = original;
        Proposto = proposto;
        Justificativa = justificativa;
        SolicitadoEmUtc = solicitadoEmUtc;
    }

    public Guid ChaveRequisicao { get; }
    public int RegistroAcessoId { get; }
    public int SolicitadoPorId { get; }
    public ValoresDescritivosAcesso Original { get; }
    public ValoresDescritivosAcesso Proposto { get; }
    public string Justificativa { get; }
    public DateTime SolicitadoEmUtc { get; }
    public StatusSolicitacaoCorrecao Status { get; private set; } = StatusSolicitacaoCorrecao.Pendente;
    public int? DecididoPorId { get; private set; }
    public DateTime? DecididoEmUtc { get; private set; }
    public string? MotivoDecisao { get; private set; }

    public void Aprovar(
        int revisorId,
        string motivo,
        DateTime decididoEmUtc,
        ValoresDescritivosAcesso valoresAtuais)
    {
        ValidateReviewer(revisorId);
        ValidatePending(decididoEmUtc);
        motivo = NormalizeReason(motivo);
        ArgumentNullException.ThrowIfNull(valoresAtuais);
        if (valoresAtuais != Original)
        {
            throw new InvalidOperationException("O registro mudou depois da solicitação; revise a proposta.");
        }

        RecordDecision(StatusSolicitacaoCorrecao.Aprovada, revisorId, motivo, decididoEmUtc);
    }

    public void Rejeitar(int revisorId, string motivo, DateTime decididoEmUtc)
    {
        ValidateReviewer(revisorId);
        ValidatePending(decididoEmUtc);
        motivo = NormalizeReason(motivo);
        RecordDecision(StatusSolicitacaoCorrecao.Rejeitada, revisorId, motivo, decididoEmUtc);
    }

    public void Cancelar(int solicitanteId, string motivo, DateTime canceladoEmUtc)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(solicitanteId);
        if (solicitanteId != SolicitadoPorId)
        {
            throw new InvalidOperationException("Somente o solicitante pode cancelar a proposta pendente.");
        }

        ValidatePending(canceladoEmUtc);
        motivo = NormalizeReason(motivo);
        RecordDecision(StatusSolicitacaoCorrecao.Cancelada, solicitanteId, motivo, canceladoEmUtc);
    }

    private void ValidateReviewer(int revisorId)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(revisorId);
        if (revisorId == SolicitadoPorId)
        {
            throw new InvalidOperationException("O solicitante não pode decidir a própria proposta.");
        }
    }

    private void ValidatePending(DateTime decisionAtUtc)
    {
        ValidateUtc(decisionAtUtc);
        if (Status != StatusSolicitacaoCorrecao.Pendente)
        {
            throw new InvalidOperationException("A solicitação já recebeu uma decisão.");
        }

        if (decisionAtUtc < SolicitadoEmUtc)
        {
            throw new ArgumentOutOfRangeException(nameof(decisionAtUtc));
        }
    }

    private static void ValidateUtc(DateTime value)
    {
        if (value == default || value.Kind != DateTimeKind.Utc)
        {
            throw new ArgumentException("Informe um instante UTC válido.", nameof(value));
        }
    }

    private static string NormalizeReason(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        value = value.Trim();
        if (value.Length is < 10 or > 500)
        {
            throw new ArgumentException("O motivo deve possuir entre 10 e 500 caracteres.", nameof(value));
        }

        return value;
    }

    private void RecordDecision(
        StatusSolicitacaoCorrecao status,
        int actorId,
        string reason,
        DateTime atUtc)
    {
        Status = status;
        DecididoPorId = actorId;
        MotivoDecisao = reason;
        DecididoEmUtc = atUtc;
    }
}
