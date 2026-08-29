using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Enums;

namespace ControleAcessoVeiculos.Domain.Tests;

public class UsoVeiculoInstitucionalTests
{
    private static readonly DateTime Saida =
        new(2026, 8, 26, 8, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void RegistrarRetorno_ShouldCompleteInstitutionalUse()
    {
        var uso = CreateUso();
        var retorno = Saida.AddHours(5);

        uso.RegistrarRetorno(retorno, quilometragemEntrada: 1025, atualizadoPorId: 2);

        Assert.Equal(StatusUsoVeiculoInstitucional.Concluido, uso.Status);
        Assert.Equal(retorno, uso.DataHoraEntrada);
        Assert.Equal(1025, uso.QuilometragemEntrada);
    }

    [Fact]
    public void RegistrarRetorno_ShouldRejectLowerMileage()
    {
        var uso = CreateUso();

        Assert.Throws<ArgumentException>(() =>
            uso.RegistrarRetorno(
                Saida.AddHours(5),
                quilometragemEntrada: 999,
                atualizadoPorId: 2));
    }

    [Fact]
    public void RegistrarRetorno_ShouldRejectTimeBeforeDeparture()
    {
        var uso = CreateUso();

        Assert.Throws<ArgumentException>(() =>
            uso.RegistrarRetorno(
                Saida.AddMinutes(-1),
                quilometragemEntrada: 1001,
                atualizadoPorId: 2));
    }

    [Fact]
    public void RegistrarRetorno_ShouldAcceptUnchangedMileage()
    {
        var uso = CreateUso();

        uso.RegistrarRetorno(
            Saida.AddHours(1),
            quilometragemEntrada: 1000,
            atualizadoPorId: 2);

        Assert.Equal(StatusUsoVeiculoInstitucional.Concluido, uso.Status);
        Assert.Equal(1000, uso.QuilometragemEntrada);
    }

    [Fact]
    public void RegistrarRetorno_ShouldRejectDuplicateReturn()
    {
        var uso = CreateUso();
        uso.RegistrarRetorno(
            Saida.AddHours(1),
            quilometragemEntrada: 1001,
            atualizadoPorId: 2);

        Assert.Throws<InvalidOperationException>(() =>
            uso.RegistrarRetorno(
                Saida.AddHours(2),
                quilometragemEntrada: 1002,
                atualizadoPorId: 2));
    }

    private static UsoVeiculoInstitucional CreateUso() =>
        new(
            veiculoId: 1,
            motoristaId: 1,
            dataHoraSaida: Saida,
            quilometragemSaida: 1000,
            itinerario: "Campus - Unidade rural",
            criadoPorId: 1);
}
