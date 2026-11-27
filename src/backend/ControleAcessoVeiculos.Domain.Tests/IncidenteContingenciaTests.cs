using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class IncidenteContingenciaTests
{
    private static readonly DateTime Now = new(2026, 11, 14, 14, 0, 0, DateTimeKind.Utc);
    [Fact]
    public void IncidentPreservesReferenceActorAndInclusiveObservedPeriod()
    {
        var id = Guid.NewGuid();
        var incident = new IncidenteContingencia(id, " Folha fictícia 01 ", Now.AddHours(-2), Now.AddHours(-1), 2, Now);
        Assert.Equal(id, incident.ChaveIncidente); Assert.Equal("Folha fictícia 01", incident.ReferenciaPapel);
        Assert.Equal(2, incident.CriadoPorId);
        Assert.True(incident.Contem(Now.AddHours(-2), Now.AddHours(-1)));
        Assert.True(incident.Contem(Now.AddHours(-1), null));
        Assert.False(incident.Contem(Now.AddHours(-3), null));
        Assert.False(incident.Contem(Now.AddHours(-2), Now));
    }
    [Theory]
    [InlineData("")]
    [InlineData("ab")]
    [InlineData("bad\0reference")]
    public void IncidentRejectsInvalidPaperReference(string reference) =>
        Assert.Throws<ArgumentException>(() => new IncidenteContingencia(Guid.NewGuid(), reference, Now.AddHours(-2), Now.AddHours(-1), 2, Now));
    [Fact]
    public void IncidentRejectsUnspecifiedFutureAndReversedTimes()
    {
        Assert.Throws<ArgumentException>(() => new IncidenteContingencia(Guid.NewGuid(), "Folha fictícia", DateTime.SpecifyKind(Now.AddHours(-2), DateTimeKind.Unspecified), Now.AddHours(-1), 2, Now));
        Assert.Throws<ArgumentException>(() => new IncidenteContingencia(Guid.NewGuid(), "Folha fictícia", Now.AddHours(-1), Now.AddHours(-2), 2, Now));
        Assert.Throws<ArgumentException>(() => new IncidenteContingencia(Guid.NewGuid(), "Folha fictícia", Now, Now.AddHours(1), 2, Now));
    }
}
