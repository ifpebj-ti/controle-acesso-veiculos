using ControleAcessoVeiculos.Domain.Entities;

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
            CreatedAtUtc.AddDays(2),
            CreatedAtUtc.AddDays(3),
            "Auditório e pátio",
            true,
            "Acesso pelo portão principal.",
            8,
            changedAtUtc);

        Assert.True(changed);
        Assert.True(entity.PermitePernoite);
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
            entity.Inicio,
            entity.Fim,
            entity.LocalArea,
            entity.PermitePernoite,
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
            CreatedAtUtc.AddDays(1),
            CreatedAtUtc.AddDays(1),
            "Campus",
            false,
            null,
            7,
            CreatedAtUtc));
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
            CreatedAtUtc.AddDays(1),
            CreatedAtUtc.AddDays(2),
            "Pátio central",
            false,
            null,
            7,
            CreatedAtUtc);
}
