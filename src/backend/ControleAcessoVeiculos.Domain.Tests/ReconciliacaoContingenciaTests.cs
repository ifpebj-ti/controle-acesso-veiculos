using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class ReconciliacaoContingenciaTests
{
    private static readonly DateTime Entry = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
    private const string Reason = "Conferência da folha fictícia concluída.";

    [Fact]
    public void Constructor_ShouldSeparateObservedFactsFromImportAndReview()
    {
        var row = Create();
        Assert.Equal(Entry, row.EntradaObservadaUtc);
        Assert.Equal(Entry.AddHours(2), row.DigitadoEmUtc);
        Assert.Null(row.SaidaObservadaNoPapelUtc);
        Assert.Equal("Operador fictício A", row.ReferenciaAutorPapel);
        Assert.Equal(2, row.DigitadoPorId);
        Assert.Equal(StatusConferenciaContingencia.Pendente, row.Status);
        Assert.Null(row.ConferidoPorId);
        Assert.Null(row.ConferidoEmUtc);
        Assert.Null(row.MotivoConferencia);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Review_ShouldPreserveAllOriginalFacts(bool accept)
    {
        var row = Create();
        Assert.True(row.Conferir(accept, 3, Reason, Entry.AddHours(3)));
        Assert.Equal(accept ? StatusConferenciaContingencia.Conferida : StatusConferenciaContingencia.Recusada, row.Status);
        Assert.Equal(3, row.ConferidoPorId);
        Assert.Equal(Entry.AddHours(3), row.ConferidoEmUtc);
        Assert.Equal(Reason, row.MotivoConferencia);
        Assert.Equal(Entry, row.EntradaObservadaUtc);
        Assert.Null(row.SaidaObservadaNoPapelUtc);
        Assert.Equal(1, row.RegistroAcessoId);
        Assert.Equal(2, row.DigitadoPorId);
        Assert.Equal("Operador fictício A", row.ReferenciaAutorPapel);
        Assert.Equal("Transcrição da folha fictícia.", row.Justificativa);
    }

    [Fact]
    public void Review_ShouldNotBlockTheOperationalExitOrInventAPaperExit()
    {
        var access = new RegistroAcesso(1, 1, 1, Entry, "Visita fictícia", 2);
        var row = Create();
        access.RegistrarSaida(Entry.AddHours(3), 4);
        Assert.Equal(StatusConferenciaContingencia.Pendente, row.Status);
        Assert.Equal(StatusRegistroAcesso.Encerrado, access.Status);
        Assert.Null(row.SaidaObservadaNoPapelUtc);
        row.Conferir(false, 3, Reason, Entry.AddHours(4));
        Assert.Equal(StatusRegistroAcesso.Encerrado, access.Status);
        Assert.Equal(Entry.AddHours(3), access.DataHoraSaida);
    }

    [Fact]
    public void Constructor_ShouldAcceptClosedPaperRowAndEqualBoundaryTimes()
    {
        var row = Create(exit: Entry.AddHours(2));
        Assert.Equal(Entry.AddHours(2), row.SaidaObservadaNoPapelUtc);
        Assert.True(row.Conferir(true, 3, Reason, row.DigitadoEmUtc));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void RepeatingTheSameDecision_ShouldNotChangeItsOriginalTimestamp(bool accept)
    {
        var row = Create();
        row.Conferir(accept, 3, Reason, Entry.AddHours(3));
        Assert.False(row.Conferir(accept, 3, $" {Reason} ", Entry.AddHours(4)));
        Assert.Equal(Entry.AddHours(3), row.ConferidoEmUtc);
        Assert.Throws<InvalidOperationException>(() => row.Conferir(!accept, 3, Reason, Entry.AddHours(4)));
        Assert.Throws<InvalidOperationException>(() => row.Conferir(accept, 4, Reason, Entry.AddHours(4)));
        Assert.Throws<InvalidOperationException>(() => row.Conferir(accept, 3, "Outra justificativa fictícia.", Entry.AddHours(4)));
    }

    [Fact]
    public void Review_ShouldRejectSelfApprovalWithoutLeavingPendingState()
    {
        var row = Create();
        Assert.Throws<InvalidOperationException>(() => row.Conferir(true, 2, Reason, Entry.AddHours(3)));
        Assert.Equal(StatusConferenciaContingencia.Pendente, row.Status);
        Assert.Null(row.ConferidoPorId);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    public void Constructor_ShouldRejectInvalidIdentifiers(int id)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Create(line: id));
        Assert.Throws<ArgumentOutOfRangeException>(() => Create(accessId: id));
        Assert.Throws<ArgumentOutOfRangeException>(() => Create(importer: id));
        Assert.Throws<ArgumentOutOfRangeException>(() => Create().Conferir(true, id, Reason, Entry.AddHours(3)));
    }

    [Fact]
    public void Constructor_ShouldRejectEmptyIncident()
    {
        Assert.Throws<ArgumentException>(() => Create(incident: Guid.Empty));
    }

    [Theory]
    [InlineData(DateTimeKind.Unspecified)]
    [InlineData(DateTimeKind.Local)]
    public void ConstructorAndReview_ShouldRejectAmbiguousTimeZones(DateTimeKind kind)
    {
        var value = DateTime.SpecifyKind(Entry, kind);
        Assert.Throws<ArgumentException>(() => Create(entry: value));
        Assert.Throws<ArgumentException>(() => Create(importedAt: value));
        Assert.Throws<ArgumentException>(() => Create(exit: value));
        Assert.Throws<ArgumentException>(() => Create().Conferir(true, 3, Reason, value));
    }

    [Fact]
    public void ConstructorAndReview_ShouldRejectMissingOrReversedTimes()
    {
        Assert.Throws<ArgumentException>(() => Create(entry: default(DateTime)));
        Assert.Throws<ArgumentException>(() => Create(importedAt: default(DateTime)));
        Assert.Throws<ArgumentException>(() => Create(entry: Entry.AddHours(3)));
        Assert.Throws<ArgumentException>(() => Create(exit: Entry.AddTicks(-1)));
        Assert.Throws<ArgumentException>(() => Create(exit: Entry.AddHours(3)));
        Assert.Throws<ArgumentException>(() => Create().Conferir(true, 3, Reason, Entry.AddHours(1)));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ConstructorAndReview_ShouldRequireAttributionAndReasons(string? value)
    {
        if (value is null)
        {
            Assert.Throws<ArgumentNullException>(() => Create(paperAuthor: value));
            Assert.Throws<ArgumentNullException>(() => Create(reason: value));
            Assert.Throws<ArgumentNullException>(() => Create().Conferir(true, 3, value!, Entry.AddHours(3)));
            return;
        }
        Assert.Throws<ArgumentException>(() => Create(paperAuthor: value));
        Assert.Throws<ArgumentException>(() => Create(reason: value));
        Assert.Throws<ArgumentException>(() => Create().Conferir(true, 3, value!, Entry.AddHours(3)));
    }

    [Fact]
    public void ConstructorAndReview_ShouldEnforceBoundedText()
    {
        Assert.Throws<ArgumentException>(() => Create(paperAuthor: new string('A', 121)));
        Assert.Throws<ArgumentException>(() => Create(reason: "Curto"));
        Assert.Throws<ArgumentException>(() => Create(reason: new string('A', 501)));
        Assert.Throws<ArgumentException>(() => Create().Conferir(true, 3, "Curto", Entry.AddHours(3)));
        Assert.Throws<ArgumentException>(() => Create().Conferir(true, 3, new string('A', 501), Entry.AddHours(3)));
    }

    private static ReconciliacaoContingencia Create(
        Guid? incident = null, int line = 1, int accessId = 1, int importer = 2,
        string? paperAuthor = " Operador fictício A ", string? reason = " Transcrição da folha fictícia. ",
        DateTime? entry = null, DateTime? exit = null, DateTime? importedAt = null) =>
        new(incident ?? Guid.NewGuid(), line, accessId, paperAuthor!, importer,
            entry ?? Entry, exit, importedAt ?? Entry.AddHours(2), reason!);
}
