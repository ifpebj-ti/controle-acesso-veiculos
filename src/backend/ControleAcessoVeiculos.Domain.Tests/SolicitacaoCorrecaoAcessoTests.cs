using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class SolicitacaoCorrecaoAcessoTests
{
    private static readonly DateTime RequestedAt = new(2026, 11, 3, 12, 0, 0, DateTimeKind.Utc);
    private static readonly ValoresDescritivosAcesso Original = new(1, "Entrega de material", null);
    private static readonly ValoresDescritivosAcesso Proposed = new(2, "Atendimento em setor", "Dado corrigido.");
    private const string Reason = "Correção solicitada após conferência presencial.";

    [Fact]
    public void RequestPreservesBothSnapshotsWithoutApplyingTheProposal()
    {
        var request = Create();
        Assert.Equal(StatusSolicitacaoCorrecao.Pendente, request.Status);
        Assert.Equal(Original, request.Original);
        Assert.Equal(Proposed, request.Proposto);
        Assert.NotEqual(request.Original, request.Proposto);
        Assert.Null(request.DecididoPorId);
        Assert.Null(request.MotivoDecisao);
        Assert.Null(request.DecididoEmUtc);
    }

    [Fact]
    public void ApprovalRecordsAnotherReviewerAndKeepsTheOriginal()
    {
        var request = Create();
        request.Aprovar(20, Reason, RequestedAt.AddMinutes(1), Original);
        Assert.Equal(StatusSolicitacaoCorrecao.Aprovada, request.Status);
        Assert.Equal(20, request.DecididoPorId);
        Assert.Equal(Reason, request.MotivoDecisao);
        Assert.Equal(RequestedAt.AddMinutes(1), request.DecididoEmUtc);
        Assert.Equal(Original, request.Original);
        Assert.Equal(Proposed, request.Proposto);
    }

    [Fact]
    public void RejectionKeepsTheProposalAndOriginalAsEvidence()
    {
        var request = Create();
        request.Rejeitar(20, Reason, RequestedAt.AddMinutes(1));
        Assert.Equal(StatusSolicitacaoCorrecao.Rejeitada, request.Status);
        Assert.Equal(20, request.DecididoPorId);
        Assert.Equal(Reason, request.MotivoDecisao);
        Assert.Equal(Original, request.Original);
        Assert.Equal(Proposed, request.Proposto);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void RequesterCannotReviewOwnProposal(bool approve)
    {
        var request = Create();
        Assert.Throws<InvalidOperationException>(() =>
        {
            if (approve) request.Aprovar(10, Reason, RequestedAt, Original);
            else request.Rejeitar(10, Reason, RequestedAt);
        });
        AssertPendingWithoutDecision(request);
    }

    [Fact]
    public void ApprovalRejectsChangedSourceWithoutRecordingADecision()
    {
        var request = Create();
        Assert.Throws<InvalidOperationException>(() => request.Aprovar(
            20, Reason, RequestedAt, new(1, "Registro já alterado por outro processo", null)));
        AssertPendingWithoutDecision(request);
    }

    [Fact]
    public void OnlyRequesterCanCancelAndCancellationPreservesEvidence()
    {
        var request = Create();
        Assert.Throws<InvalidOperationException>(() => request.Cancelar(20, Reason, RequestedAt));
        AssertPendingWithoutDecision(request);
        request.Cancelar(10, Reason, RequestedAt);
        Assert.Equal(StatusSolicitacaoCorrecao.Cancelada, request.Status);
        Assert.Equal(Original, request.Original);
        Assert.Equal(Proposed, request.Proposto);
    }

    [Theory]
    [InlineData(StatusSolicitacaoCorrecao.Aprovada)]
    [InlineData(StatusSolicitacaoCorrecao.Rejeitada)]
    [InlineData(StatusSolicitacaoCorrecao.Cancelada)]
    public void TerminalDecisionCannotBeOverwritten(StatusSolicitacaoCorrecao state)
    {
        var request = Create();
        if (state == StatusSolicitacaoCorrecao.Aprovada) request.Aprovar(20, Reason, RequestedAt, Original);
        else if (state == StatusSolicitacaoCorrecao.Rejeitada) request.Rejeitar(20, Reason, RequestedAt);
        else request.Cancelar(10, Reason, RequestedAt);
        Assert.Throws<InvalidOperationException>(() => request.Aprovar(30, Reason, RequestedAt, Original));
        Assert.Throws<InvalidOperationException>(() => request.Rejeitar(30, Reason, RequestedAt));
        Assert.Throws<InvalidOperationException>(() => request.Cancelar(10, Reason, RequestedAt));
        Assert.Equal(state, request.Status);
    }

    [Theory]
    [InlineData(9)]
    [InlineData(501)]
    public void InvalidDecisionReasonDoesNotMutateState(int length)
    {
        var request = Create();
        Assert.Throws<ArgumentException>(() => request.Aprovar(20, new string('x', length), RequestedAt, Original));
        Assert.Throws<ArgumentException>(() => request.Rejeitar(20, new string('x', length), RequestedAt));
        Assert.Throws<ArgumentException>(() => request.Cancelar(10, new string('x', length), RequestedAt));
        AssertPendingWithoutDecision(request);
    }

    [Theory]
    [InlineData(9)]
    [InlineData(501)]
    public void RequestRequiresBoundedJustification(int length)
    {
        Assert.Throws<ArgumentException>(() => new SolicitacaoCorrecaoAcesso(
            Guid.NewGuid(), 1, 10, Original, Proposed, new string('x', length), RequestedAt));
    }

    [Fact]
    public void RequestRejectsNoChangeAfterNormalization()
    {
        Assert.Throws<ArgumentException>(() => new SolicitacaoCorrecaoAcesso(
            Guid.NewGuid(), 1, 10, Original, new(1, " Entrega de material ", "  "), Reason, RequestedAt));
    }

    [Fact]
    public void InvalidChronologyDoesNotMutateState()
    {
        var request = Create();
        Assert.Throws<ArgumentOutOfRangeException>(() => request.Aprovar(20, Reason, RequestedAt.AddTicks(-1), Original));
        Assert.Throws<ArgumentException>(() => request.Aprovar(20, Reason, DateTime.SpecifyKind(RequestedAt, DateTimeKind.Unspecified), Original));
        AssertPendingWithoutDecision(request);
    }

    [Fact]
    public void RequestRequiresUtcIdentifiersAndARequestKey()
    {
        Assert.Throws<ArgumentException>(() => new SolicitacaoCorrecaoAcesso(Guid.Empty, 1, 10, Original, Proposed, Reason, RequestedAt));
        Assert.Throws<ArgumentOutOfRangeException>(() => new SolicitacaoCorrecaoAcesso(Guid.NewGuid(), 0, 10, Original, Proposed, Reason, RequestedAt));
        Assert.Throws<ArgumentOutOfRangeException>(() => new SolicitacaoCorrecaoAcesso(Guid.NewGuid(), 1, 0, Original, Proposed, Reason, RequestedAt));
        Assert.Throws<ArgumentException>(() => new SolicitacaoCorrecaoAcesso(Guid.NewGuid(), 1, 10, Original, Proposed, Reason, default));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void ReviewerMustHaveAValidIdentifier(int reviewerId)
    {
        var request = Create();
        Assert.Throws<ArgumentOutOfRangeException>(() => request.Aprovar(reviewerId, Reason, RequestedAt, Original));
        Assert.Throws<ArgumentOutOfRangeException>(() => request.Rejeitar(reviewerId, Reason, RequestedAt));
        AssertPendingWithoutDecision(request);
    }

    [Fact]
    public void SnapshotsRejectInvalidOrOversizedValues()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new ValoresDescritivosAcesso(0, "Objetivo", null));
        Assert.Throws<ArgumentException>(() => new ValoresDescritivosAcesso(1, " ", null));
        Assert.Throws<ArgumentException>(() => new ValoresDescritivosAcesso(1, new string('x', 501), null));
        Assert.Throws<ArgumentException>(() => new ValoresDescritivosAcesso(1, "Objetivo", new string('x', 1001)));
    }

    private static SolicitacaoCorrecaoAcesso Create() =>
        new(Guid.NewGuid(), 1, 10, Original, Proposed, Reason, RequestedAt);

    private static void AssertPendingWithoutDecision(SolicitacaoCorrecaoAcesso request)
    {
        Assert.Equal(StatusSolicitacaoCorrecao.Pendente, request.Status);
        Assert.Null(request.DecididoPorId);
        Assert.Null(request.DecididoEmUtc);
        Assert.Null(request.MotivoDecisao);
    }
}
