namespace ControleAcessoVeiculos.Application.Authentication;

public sealed record AuthenticationMethodPolicy(
    bool OperationalGoogleOnly,
    HomologationPasswordAccessPolicy? TestAccess = null);
