namespace ControleAcessoVeiculos.Application.AdministrativeReports;

public interface IAdministrativeReportPdfRenderer
{
    byte[] RenderVehicleMovements(
        AdministrativeReportExport<VehicleMovementReportItem> report);

    byte[] RenderInstitutionalFleet(
        AdministrativeReportExport<InstitutionalFleetReportItem> report);
}
