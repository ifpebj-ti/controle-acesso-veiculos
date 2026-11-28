using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class EventoAcessoTests
{
    private static readonly DateTime CreatedAtUtc =
        new(2026, 8, 30, 10, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Constructor_ShouldCreateActiveEventWithAuthorship()
    {
        var entity = CreateEvent();

        Assert.True(entity.Ativo);
        Assert.Equal("extensao@example.test", entity.ContatoResponsavel);
        Assert.Equal(LocalEstacionamentoEvento.Externo, entity.LocalEstacionamento);
        Assert.Equal(7, entity.CriadoPorId);
        Assert.Equal(CreatedAtUtc, entity.DataCriacao);
        Assert.Null(entity.AtualizadoPorId);
    }

    [Fact]
    public void Update_ShouldTrackActorAndServerTime()
    {
        var entity = CreateEvent();
        var changedAtUtc = CreatedAtUtc.AddHours(1);

        var changed = entity.Atualizar(
            "Jardim Digital 2026",
            "Coordenação de Extensão",
            "extensao@example.test",
            CreatedAtUtc.AddDays(2),
            CreatedAtUtc.AddDays(3),
            "Auditório e pátio",
            true,
            LocalEstacionamentoEvento.Interno,
            "Acesso pelo portão principal.",
            8,
            changedAtUtc);

        Assert.True(changed);
        Assert.True(entity.PermitePernoite);
        Assert.Equal(LocalEstacionamentoEvento.Interno, entity.LocalEstacionamento);
        Assert.Equal(8, entity.AtualizadoPorId);
        Assert.Equal(changedAtUtc, entity.DataAlteracao);
    }

    [Fact]
    public void Cancel_ShouldPreventFurtherChanges()
    {
        var entity = CreateEvent();
        entity.Cancelar(8, CreatedAtUtc.AddHours(1));

        Assert.False(entity.Ativo);
        Assert.Throws<InvalidOperationException>(() => entity.Cancelar(
            8,
            CreatedAtUtc.AddHours(2)));
        Assert.Throws<InvalidOperationException>(() => entity.Atualizar(
            entity.Nome,
            entity.Responsavel,
            entity.ContatoResponsavel,
            entity.Inicio,
            entity.Fim,
            entity.LocalArea,
            entity.PermitePernoite,
            entity.LocalEstacionamento,
            entity.Observacao,
            8,
            CreatedAtUtc.AddHours(2)));
    }

    [Fact]
    public void Constructor_ShouldRejectInvalidPeriod()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new EventoAcesso(
            "Evento",
            "Responsável",
            "+55 81 99999-0000",
            CreatedAtUtc.AddDays(1),
            CreatedAtUtc.AddDays(1),
            "Campus",
            false,
            LocalEstacionamentoEvento.ADefinir,
            null,
            7,
            CreatedAtUtc));
    }

    [Theory]
    [InlineData("", "Responsável", "Campus")]
    [InlineData("Evento", " ", "Campus")]
    [InlineData("Evento", "Responsável", "\t")]
    public void Constructor_ShouldRejectRequiredBlankText(
        string name,
        string responsible,
        string location)
    {
        Assert.Throws<ArgumentException>(() => new EventoAcesso(
            name,
            responsible,
            null,
            CreatedAtUtc.AddDays(1),
            CreatedAtUtc.AddDays(2),
            location,
            false,
            LocalEstacionamentoEvento.ADefinir,
            null,
            7,
            CreatedAtUtc));
    }

    [Fact]
    public void Constructor_ShouldRejectInvalidEnumAndAuthorship()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new EventoAcesso(
            "Evento",
            "Responsável",
            null,
            CreatedAtUtc.AddDays(1),
            CreatedAtUtc.AddDays(2),
            "Campus",
            false,
            (LocalEstacionamentoEvento)999,
            null,
            7,
            CreatedAtUtc));

        Assert.Throws<ArgumentOutOfRangeException>(() => new EventoAcesso(
            "Evento",
            "Responsável",
            null,
            CreatedAtUtc.AddDays(1),
            CreatedAtUtc.AddDays(2),
            "Campus",
            false,
            LocalEstacionamentoEvento.ADefinir,
            null,
            0,
            CreatedAtUtc));

        Assert.Throws<ArgumentOutOfRangeException>(() => new EventoAcesso(
            "Evento",
            "Responsável",
            null,
            CreatedAtUtc.AddDays(1),
            CreatedAtUtc.AddDays(2),
            "Campus",
            false,
            LocalEstacionamentoEvento.ADefinir,
            null,
            7,
            default));
    }

    [Theory]
    [InlineData(201, 1, 0, 1, 0)]
    [InlineData(1, 201, 0, 1, 0)]
    [InlineData(1, 1, 255, 1, 0)]
    [InlineData(1, 1, 0, 201, 0)]
    [InlineData(1, 1, 0, 1, 1001)]
    public void Constructor_ShouldRejectTextAboveConfiguredLimits(
        int nameLength,
        int responsibleLength,
        int contactLength,
        int locationLength,
        int observationLength)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new EventoAcesso(
            new string('N', nameLength),
            new string('R', responsibleLength),
            contactLength == 0 ? null : new string('C', contactLength),
            CreatedAtUtc.AddDays(1),
            CreatedAtUtc.AddDays(2),
            new string('L', locationLength),
            false,
            LocalEstacionamentoEvento.ADefinir,
            observationLength == 0 ? null : new string('O', observationLength),
            7,
            CreatedAtUtc));
    }

    [Fact]
    public void Update_ShouldReturnFalseWhenValuesAreUnchanged()
    {
        var entity = CreateEvent();

        var changed = entity.Atualizar(
            entity.Nome,
            entity.Responsavel,
            entity.ContatoResponsavel,
            entity.Inicio,
            entity.Fim,
            entity.LocalArea,
            entity.PermitePernoite,
            entity.LocalEstacionamento,
            entity.Observacao,
            8,
            CreatedAtUtc.AddHours(1));

        Assert.False(changed);
        Assert.Null(entity.AtualizadoPorId);
        Assert.Null(entity.DataAlteracao);
    }

    [Fact]
    public void ChangeTracking_ShouldValidateActorAndTimestamp()
    {
        var entity = CreateEvent();

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            entity.RegistrarAlteracao(0, CreatedAtUtc));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            entity.RegistrarAlteracao(8, CreatedAtUtc.AddTicks(-1)));

        entity.RegistrarAlteracao(8, CreatedAtUtc.AddHours(1));

        Assert.Equal(8, entity.AtualizadoPorId);
        Assert.Equal(CreatedAtUtc.AddHours(1), entity.DataAlteracao);

        entity.Cancelar(8, CreatedAtUtc.AddHours(2));
        Assert.Throws<InvalidOperationException>(() =>
            entity.RegistrarAlteracao(8, CreatedAtUtc.AddHours(3)));
    }

    [Fact]
    public void VehicleRule_ShouldRequireUnitQuantityForPlate()
    {
        var rule = new AutorizacaoVeiculoEvento(10, "AUTOMÓVEL", 1, "ABC1D23");

        Assert.Equal("ABC1D23", rule.Placa);
        Assert.Throws<ArgumentException>(() =>
            new AutorizacaoVeiculoEvento(10, "AUTOMÓVEL", 2, "ABC1D23"));
    }

    private static EventoAcesso CreateEvent() =>
        new(
            "Jardim Digital",
            "Coordenação de Extensão",
            "extensao@example.test",
            CreatedAtUtc.AddDays(1),
            CreatedAtUtc.AddDays(2),
            "Pátio central",
            false,
            LocalEstacionamentoEvento.Externo,
            null,
            7,
            CreatedAtUtc);
}
