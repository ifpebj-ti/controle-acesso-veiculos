namespace ControleAcessoVeiculos.Application.AdministrativeReports;

public interface IAdministrativeReportExportSecurity
{
    Task<AdministrativeReportExportConfirmation> ConfirmLocalPasswordAsync(
        int actorUserId,
        string password,
        CancellationToken cancellationToken);
}
