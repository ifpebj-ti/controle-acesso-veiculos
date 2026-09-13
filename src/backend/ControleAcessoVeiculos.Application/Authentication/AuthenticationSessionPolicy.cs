namespace ControleAcessoVeiculos.Application.Authentication;

public sealed record AuthenticationSessionPolicy(
    TimeSpan InactivityTimeout,
    TimeSpan AbsoluteLifetime)
{
    public AuthenticationSessionPolicy Validate()
    {
        if (InactivityTimeout <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(InactivityTimeout));
        }

        if (AbsoluteLifetime <= InactivityTimeout)
        {
            throw new ArgumentOutOfRangeException(
                nameof(AbsoluteLifetime),
                "A duracao absoluta deve ser superior ao limite de inatividade.");
        }

        return this;
    }
}
