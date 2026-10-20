namespace ControleAcessoVeiculos.IntegrationTests;

internal static class TestPlate
{
    public static string From(string source)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(source);
        var characters = source.Where(char.IsLetterOrDigit)
            .Select(char.ToUpperInvariant)
            .ToArray();
        if (characters.Length < 7)
        {
            throw new ArgumentException("A origem deve possuir ao menos 7 caracteres.", nameof(source));
        }

        return string.Create(7, characters, static (result, value) =>
        {
            result[0] = ToLetter(value[0]);
            result[1] = ToLetter(value[1]);
            result[2] = ToLetter(value[2]);
            result[3] = ToDigit(value[3]);
            result[4] = ToLetter(value[4]);
            result[5] = ToDigit(value[5]);
            result[6] = ToDigit(value[6]);
        });
    }

    private static char ToLetter(char value) =>
        (char)('A' + NumericValue(value) % 26);

    private static char ToDigit(char value) =>
        (char)('0' + NumericValue(value) % 10);

    private static int NumericValue(char value) =>
        value is >= '0' and <= '9' ? value - '0' : value - 'A' + 10;
}
