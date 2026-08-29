namespace ControleAcessoVeiculos.API.Security;

public static class AuthorizationPolicies
{
    public const string OperateAccess = "access:operate";
    public const string ReviewTransportationRecords = "transportation:review";
    public const string ReadInstitutionalVehicleCatalog = "institutional-vehicles:read";
    public const string ManageInstitutionalVehicleCatalog = "institutional-vehicles:manage";
    public const string ManageUsers = "users:manage";
}
