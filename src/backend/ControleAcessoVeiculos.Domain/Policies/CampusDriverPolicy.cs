namespace ControleAcessoVeiculos.Domain.Policies;

public static class CampusDriverPolicy
{
    public static readonly IReadOnlyList<string> Affiliations =
        Array.AsReadOnly(new[] { "Aluno", "Terceirizado", "Federal" });

    // A leap-day birthday reaches the cutoff on 1 March in a non-leap year.
    public static bool IsAdult(DateOnly birthDate, DateOnly onDate) =>
        onDate.Year > 18 && birthDate != DateOnly.MinValue && birthDate <= onDate.AddYears(-18);

    public static string? NormalizeAffiliation(string? value) =>
        Affiliations.FirstOrDefault(item => string.Equals(item, value?.Trim(),
            StringComparison.OrdinalIgnoreCase));
}
