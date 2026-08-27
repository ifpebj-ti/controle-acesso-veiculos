namespace ControleAcessoVeiculos.API.Security;

public static class AuthorizationPolicies
{
    public const string OperateAccess = "access:operate";
    public const string ReviewTransportationRecords = "transportation:review";
    public const string ManageUsers = "users:manage";
}
