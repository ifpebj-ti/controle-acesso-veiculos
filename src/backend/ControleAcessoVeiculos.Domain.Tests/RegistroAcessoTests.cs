using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Tests;

public class RegistroAcessoTests
{
    private static readonly DateTime Entrada =
        new(2026, 8, 26, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Constructor_ShouldCreateOpenAccessRecord()
    {
        var registro = CreateRegistro();

        Assert.Equal(StatusRegistroAcesso.Aberto, registro.Status);
        Assert.Equal("Visita técnica", registro.Objetivo);
        Assert.Null(registro.DataHoraSaida);
    }

    [Fact]
    public void RegistrarSaida_ShouldCloseAccessRecord()
    {
        var registro = CreateRegistro();
        var saida = Entrada.AddHours(2);

        registro.RegistrarSaida(saida, atualizadoPorId: 2);

        Assert.Equal(StatusRegistroAcesso.Encerrado, registro.Status);
        Assert.Equal(saida, registro.DataHoraSaida);
        Assert.Equal(2, registro.AtualizadoPorId);
    }

    [Fact]
    public void RegistrarSaida_ShouldRejectTimeBeforeEntry()
    {
        var registro = CreateRegistro();

        Assert.Throws<ArgumentException>(() =>
            registro.RegistrarSaida(Entrada.AddMinutes(-1), atualizadoPorId: 2));
    }

    [Fact]
    public void RegistrarSaida_ShouldRejectAlreadyClosedRecord()
    {
        var registro = CreateRegistro();
        registro.RegistrarSaida(Entrada.AddHours(1), atualizadoPorId: 2);

        Assert.Throws<InvalidOperationException>(() =>
            registro.RegistrarSaida(Entrada.AddHours(2), atualizadoPorId: 2));
    }

    [Fact]
    public void CorrigirDados_ShouldUpdateOnlyCorrectableFields()
    {
        var registro = CreateRegistro();
        var originalVehicleId = registro.VeiculoId;
        var originalPersonId = registro.PessoaId;
        var originalEntryAt = registro.DataHoraEntrada;
        var changedAt = DateTime.UtcNow.AddMinutes(1);

        var changed = registro.CorrigirDados(
            categoriaAcessoId: 2,
            objetivo: "  Entrega autorizada  ",
            observacao: "  Conferido pelo vigilante  ",
            atualizadoPorId: 3,
            dataAlteracao: changedAt);

        Assert.True(changed);
        Assert.Equal(2, registro.CategoriaAcessoId);
        Assert.Equal("Entrega autorizada", registro.Objetivo);
        Assert.Equal("Conferido pelo vigilante", registro.Observacao);
        Assert.Equal(3, registro.AtualizadoPorId);
        Assert.Equal(changedAt, registro.DataAlteracao);
        Assert.Equal(originalVehicleId, registro.VeiculoId);
        Assert.Equal(originalPersonId, registro.PessoaId);
        Assert.Equal(originalEntryAt, registro.DataHoraEntrada);
        Assert.Equal(StatusRegistroAcesso.Aberto, registro.Status);
    }

    [Fact]
    public void CorrigirDados_ShouldNotChangeMetadataWhenValuesAreEqual()
    {
        var registro = CreateRegistro();

        var changed = registro.CorrigirDados(
            registro.CategoriaAcessoId,
            " Visita técnica ",
            observacao: null,
            atualizadoPorId: 3,
            dataAlteracao: DateTime.UtcNow.AddMinutes(1));

        Assert.False(changed);
        Assert.Null(registro.AtualizadoPorId);
        Assert.Null(registro.DataAlteracao);
    }

    [Fact]
    public void CorrigirDados_ShouldRejectInvalidArguments()
    {
        var registro = CreateRegistro();

        Assert.Throws<ArgumentOutOfRangeException>(() => registro.CorrigirDados(
            0, "Objetivo", null, 2, DateTime.UtcNow));
        Assert.Throws<ArgumentException>(() => registro.CorrigirDados(
            1, " ", null, 2, DateTime.UtcNow));
        Assert.Throws<ArgumentOutOfRangeException>(() => registro.CorrigirDados(
            1, "Objetivo", null, 0, DateTime.UtcNow));
        Assert.Throws<ArgumentOutOfRangeException>(() => registro.CorrigirDados(
            1, "Objetivo", null, 2, default));
    }

    private static RegistroAcesso CreateRegistro() =>
        new(
            veiculoId: 1,
            pessoaId: 1,
            categoriaAcessoId: 1,
            dataHoraEntrada: Entrada,
            objetivo: "Visita técnica",
            criadoPorId: 1);
}
