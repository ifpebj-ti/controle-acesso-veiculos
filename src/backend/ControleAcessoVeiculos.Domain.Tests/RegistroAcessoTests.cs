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

    private static RegistroAcesso CreateRegistro() =>
        new(
            veiculoId: 1,
            pessoaId: 1,
            categoriaAcessoId: 1,
            dataHoraEntrada: Entrada,
            objetivo: "Visita técnica",
            criadoPorId: 1);
}
