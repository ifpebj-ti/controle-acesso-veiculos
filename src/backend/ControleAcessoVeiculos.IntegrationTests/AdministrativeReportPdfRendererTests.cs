using System.Text;
using ControleAcessoVeiculos.API.Reports;
using ControleAcessoVeiculos.Application.AdministrativeReports;
using QuestPDF.Infrastructure;

namespace ControleAcessoVeiculos.IntegrationTests;

public sealed class AdministrativeReportPdfRendererTests
{
    [Fact]
    public void EmptyVehicleMovementReportProducesAValidPdf()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var renderer = new AdministrativeReportPdfRenderer(
            TimeZoneInfo.FindSystemTimeZoneById("America/Recife"));
        var report = new AdministrativeReportExport<VehicleMovementReportItem>(
            [],
            0,
            new DateOnly(2026, 10, 1),
            new DateOnly(2026, 10, 2),
            "America/Recife",
            new DateTime(2026, 10, 15, 12, 0, 0, DateTimeKind.Utc),
            "Administrador de Teste",
            new Dictionary<string, string?>());

        var content = renderer.RenderVehicleMovements(report);

        Assert.True(content.Length > 100);
        Assert.Equal("%PDF-", Encoding.ASCII.GetString(content, 0, 5));
    }

    [Fact]
    public void FleetReportWithAccentedContentProducesAValidPdf()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var renderer = new AdministrativeReportPdfRenderer(
            TimeZoneInfo.FindSystemTimeZoneById("America/Recife"));
        var actor = new ReportActor(1, "José de Teste", "Administrador");
        var item = new InstitutionalFleetReportItem(
            1,
            "ABC1D23",
            "Veículo institucional",
            "Condutor fictício",
            new DateTime(2026, 10, 15, 11, 0, 0, DateTimeKind.Utc),
            1000,
            new DateTime(2026, 10, 15, 14, 0, 0, DateTimeKind.Utc),
            1030,
            30,
            "Belo Jardim — Pesqueira",
            "Concluido",
            actor,
            actor);
        var report = new AdministrativeReportExport<InstitutionalFleetReportItem>(
            [item],
            1,
            new DateOnly(2026, 10, 15),
            new DateOnly(2026, 10, 15),
            "America/Recife",
            new DateTime(2026, 10, 15, 15, 0, 0, DateTimeKind.Utc),
            actor.Name,
            new Dictionary<string, string?> { ["plate"] = "ABC1D23" });

        var content = renderer.RenderInstitutionalFleet(report);

        Assert.True(content.Length > 100);
        Assert.Equal("%PDF-", Encoding.ASCII.GetString(content, 0, 5));
    }
}
