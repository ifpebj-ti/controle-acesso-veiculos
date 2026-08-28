namespace ControleAcessoVeiculos.Application.Authorization;

public static class ProfileNames
{
    public const string Doorman = "Porteiro";
    public const string SecurityGuard = "Vigilante";
    public const string TransportationDepartment = "SetorTransporte";
    public const string Administrator = "Administrador";

    public static readonly IReadOnlySet<string> Supported = new HashSet<string>(
        StringComparer.Ordinal)
    {
        Doorman,
        SecurityGuard,
        TransportationDepartment,
        Administrator
    };
}
