using ControleAcessoVeiculos.Domain.Entities;

namespace ControleAcessoVeiculos.Application.Authentication;

public sealed record AuthenticationUser(
    Usuario User,
    string ProfileName,
    bool ProfileIsActive);
