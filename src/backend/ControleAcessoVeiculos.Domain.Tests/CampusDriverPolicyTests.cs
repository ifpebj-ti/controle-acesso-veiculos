using ControleAcessoVeiculos.Domain.Entities;
using ControleAcessoVeiculos.Domain.Policies;

namespace ControleAcessoVeiculos.Domain.Tests;

public sealed class CampusDriverPolicyTests
{
    [Theory]
    [InlineData("2008-11-12", true)]
    [InlineData("2008-11-13", false)]
    [InlineData("2010-01-01", false)]
    [InlineData("2027-01-01", false)]
    [InlineData("1990-01-01", true)]
    [InlineData("0001-01-01", false)]
    public void EnforcesEighteenthBirthday(string birthDate, bool expected) =>
        Assert.Equal(expected, CampusDriverPolicy.IsAdult(DateOnly.Parse(birthDate), new(2026, 11, 12)));

    [Theory]
    [InlineData("2026-02-28", false)]
    [InlineData("2026-03-01", true)]
    public void LeapDayCutoffIsExplicit(string onDate, bool expected) =>
        Assert.Equal(expected, CampusDriverPolicy.IsAdult(new(2008, 2, 29), DateOnly.Parse(onDate)));

    [Fact]
    public void RegistryIsSeparateFromLoginAndDoesNotDeactivatePerson()
    {
        var person = new Pessoa("Pessoa Fictícia");
        var now = new DateTime(2026, 11, 12, 12, 0, 0, DateTimeKind.Utc);
        Assert.False(person.CadastroCampusAtivo);
        Assert.Null(person.DataNascimento);
        person.CadastrarCondutorCampus(" federal ", new(1990, 1, 1), 42, now, new(2026, 11, 12));
        Assert.Equal("Federal", person.TipoVinculo);
        Assert.Equal(42, person.CadastroCampusConferidoPorId);
        Assert.True(person.CadastroCampusAtivo);
        person.DesativarCadastroCampus(now);
        Assert.False(person.CadastroCampusAtivo);
        Assert.True(person.Ativo);
        Assert.Null(person.DocumentoNumero);
    }

    [Fact]
    public void RejectsMinorBeforeChangingEntity()
    {
        var person = new Pessoa("Pessoa Fictícia");
        Assert.Throws<ArgumentException>(() => person.CadastrarCondutorCampus("Aluno",
            new(2010, 1, 1), 42, DateTime.UtcNow, new(2026, 11, 12)));
        Assert.False(person.CadastroCampusAtivo);
        Assert.Null(person.DataNascimento);
    }
}
