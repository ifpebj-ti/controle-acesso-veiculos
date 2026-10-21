using ControleAcessoVeiculos.Application.AdministrativeReports;
using ControleAcessoVeiculos.Application.Authentication;
using ControleAcessoVeiculos.Application.Authorization;
using ControleAcessoVeiculos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleAcessoVeiculos.Infrastructure.AdministrativeReports;

public sealed class AdministrativeReportExportSecurity(
    ControleAcessoVeiculosDbContext dbContext,
    IPasswordHashService passwordHashService,
    TimeProvider timeProvider) : IAdministrativeReportExportSecurity
{
    public async Task<AdministrativeReportExportConfirmation> ConfirmLocalPasswordAsync(
        int actorUserId,
        string password,
        CancellationToken cancellationToken)
    {
        var actor = await (
            from user in dbContext.Usuarios.AsNoTracking()
            join person in dbContext.Pessoas.AsNoTracking()
                on user.PessoaId equals person.Id
            join profile in dbContext.Perfis.AsNoTracking()
                on user.PerfilId equals profile.Id
            where user.Id == actorUserId
            select new
            {
                User = user,
                person.Nome,
                ProfileName = profile.Nome
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (actor is null ||
            !actor.User.PodeAutenticarComSenha(timeProvider.GetUtcNow().UtcDateTime) ||
            !string.Equals(
                actor.ProfileName,
                ProfileNames.Administrator,
                StringComparison.Ordinal))
        {
            passwordHashService.PerformDummyVerification(password);
            return AdministrativeReportExportConfirmation.Unauthorized();
        }

        var verification = passwordHashService.Verify(actor.User.SenhaHash!, password);
        return verification == PasswordHashVerificationResult.Failed
            ? AdministrativeReportExportConfirmation.Unauthorized()
            : AdministrativeReportExportConfirmation.Success(actor.Nome);
    }
}
