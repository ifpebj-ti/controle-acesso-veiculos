namespace ControleAcessoVeiculos.Application.Authentication;

public enum PasswordHashVerificationResult
{
    Failed = 0,
    Success = 1,
    SuccessRehashNeeded = 2
}
