using ControleAcessoVeiculos.Application.AccessRecords;

namespace ControleAcessoVeiculos.Application.Tests;

public sealed class AccessCategoryNamesTests
{
    [Theory]
    [InlineData(" aluno ", "Aluno")]
    [InlineData("TERCEIRIZADO", "Terceirizado")]
    [InlineData("federal", "Federal")]
    [InlineData("Visitante", "Visitante")]
    [InlineData("Prestador de serviço", "Prestador de serviço")]
    [InlineData("Entrega", "Entrega")]
    [InlineData("Evento", "Evento")]
    [InlineData("Treino ou jogo", "Treino ou jogo")]
    [InlineData("Caminhada com veículo", "Caminhada com veículo")]
    [InlineData("Mototáxi", "Mototáxi")]
    [InlineData("Permanência excepcional", "Permanência excepcional")]
    [InlineData("Outro acesso autorizado", "Outro acesso autorizado")]
    public void NormalizesAllSupportedNames(string input, string expected)
    {
        Assert.True(AccessCategoryNames.TryGetCanonicalName(input, out var canonical));
        Assert.Equal(expected, canonical);
        Assert.Contains(expected, AccessCategoryNames.Supported);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Servidor não cadastrado")]
    [InlineData("Aluno\0")]
    public void RejectsUnknownCategories(string? input) =>
        Assert.False(AccessCategoryNames.TryGetCanonicalName(input, out _));
}
