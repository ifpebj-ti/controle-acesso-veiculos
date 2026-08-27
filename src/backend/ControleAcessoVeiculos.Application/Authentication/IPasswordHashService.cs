namespace ControleAcessoVeiculos.Application.Authentication;

public interface IPasswordHashService
{
    string Hash(string password);
    bool Verify(string passwordHash, string password);
    void PerformDummyVerification(string password);
}
