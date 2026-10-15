namespace ControleAcessoVeiculos.Application.AdministrativeReports;

public interface IAdministrativeReportStore
{
    Task<PagedAdministrativeReport<VehicleMovementReportItem>> SearchVehicleMovementsAsync(
        AdministrativeReportCriteria criteria,
        string timeZoneId,
        CancellationToken cancellationToken);

    Task<PagedAdministrativeReport<InstitutionalFleetReportItem>> SearchInstitutionalFleetAsync(
        AdministrativeReportCriteria criteria,
        string timeZoneId,
        CancellationToken cancellationToken);

    Task RecordConsultationAsync(
        int actorUserId,
        string reportType,
        DateOnly from,
        DateOnly to,
        bool succeeded,
        CancellationToken cancellationToken);
}
