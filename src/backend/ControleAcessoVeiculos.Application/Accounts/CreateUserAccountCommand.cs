namespace ControleAcessoVeiculos.Application.Accounts;

public sealed record CreateUserAccountCommand(
    string Name,
    string Email,
    string Password,
    string ProfileName);
