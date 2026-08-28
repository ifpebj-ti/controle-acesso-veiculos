namespace ControleAcessoVeiculos.Application.AccessRecords;

public static class AccessCategoryNames
{
    public const string Visitor = "Visitante";
    public const string ServiceProvider = "Prestador de serviço";
    public const string Delivery = "Entrega";
    public const string Event = "Evento";
    public const string TrainingOrMatch = "Treino ou jogo";
    public const string VehicleWalk = "Caminhada com veículo";
    public const string MotorcycleTaxi = "Mototáxi";
    public const string ExceptionalStay = "Permanência excepcional";
    public const string OtherAuthorizedAccess = "Outro acesso autorizado";

    private static readonly IReadOnlyDictionary<string, string> CanonicalNames =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [Visitor] = Visitor,
            [ServiceProvider] = ServiceProvider,
            [Delivery] = Delivery,
            [Event] = Event,
            [TrainingOrMatch] = TrainingOrMatch,
            [VehicleWalk] = VehicleWalk,
            [MotorcycleTaxi] = MotorcycleTaxi,
            [ExceptionalStay] = ExceptionalStay,
            [OtherAuthorizedAccess] = OtherAuthorizedAccess
        };

    public static IReadOnlyCollection<string> Supported { get; } =
        CanonicalNames.Values.ToArray();

    public static bool TryGetCanonicalName(string? name, out string canonicalName)
    {
        if (!string.IsNullOrWhiteSpace(name) &&
            CanonicalNames.TryGetValue(name.Trim(), out var value))
        {
            canonicalName = value;
            return true;
        }

        canonicalName = string.Empty;
        return false;
    }
}
