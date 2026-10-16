using System.Globalization;
using ControleAcessoVeiculos.Application.AdministrativeReports;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ControleAcessoVeiculos.API.Reports;

public sealed class AdministrativeReportPdfRenderer(
    TimeZoneInfo institutionalTimeZone) : IAdministrativeReportPdfRenderer
{
    private static readonly CultureInfo Culture = CultureInfo.GetCultureInfo("pt-BR");

    public byte[] RenderVehicleMovements(
        AdministrativeReportExport<VehicleMovementReportItem> report) =>
        Render(
            "Relatório de movimentações de veículos",
            report,
            (column, item) => column.Item().Element(container =>
                ComposeVehicleMovement(container, item)));

    public byte[] RenderInstitutionalFleet(
        AdministrativeReportExport<InstitutionalFleetReportItem> report) =>
        Render(
            "Relatório de utilizações da frota institucional",
            report,
            (column, item) => column.Item().Element(container =>
                ComposeInstitutionalFleet(container, item)));

    private byte[] Render<T>(
        string title,
        AdministrativeReportExport<T> report,
        Action<ColumnDescriptor, T> composeItem)
    {
        var generatedAt = ToInstitutionalTime(report.GeneratedAtUtc);
        return Document.Create(document =>
        {
            document.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(32);
                page.DefaultTextStyle(style => style
                    .FontFamily("Lato")
                    .FontSize(9)
                    .FontColor(Colors.Grey.Darken4));

                page.Header().Column(column =>
                {
                    column.Spacing(5);
                    column.Item().Text("IFPE — Campus Belo Jardim")
                        .FontSize(11)
                        .SemiBold()
                        .FontColor(Colors.Green.Darken2);
                    column.Item().Text(title).FontSize(18).Bold();
                    column.Item().Text(
                        $"Período: {report.From:dd/MM/yyyy} a {report.To:dd/MM/yyyy} · " +
                        $"Fuso: {report.TimeZoneId}");
                    column.Item().Text(
                        $"Gerado em {generatedAt:dd/MM/yyyy HH:mm:ss} por {report.GeneratedBy} · " +
                        $"{report.TotalCount} registro(s)");
                    ComposeFilters(column, report.Filters);
                    column.Item().PaddingTop(5).LineHorizontal(1)
                        .LineColor(Colors.Grey.Lighten1);
                });

                page.Content().PaddingTop(12).Column(column =>
                {
                    column.Spacing(8);
                    if (report.Items.Count == 0)
                    {
                        column.Item()
                            .Border(1)
                            .BorderColor(Colors.Grey.Lighten1)
                            .Background(Colors.Grey.Lighten4)
                            .Padding(16)
                            .Text("Nenhum registro encontrado para os filtros informados.")
                            .SemiBold();
                        return;
                    }

                    foreach (var item in report.Items)
                    {
                        composeItem(column, item);
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Página ");
                    text.CurrentPageNumber();
                    text.Span(" de ");
                    text.TotalPages();
                });
            });
        }).GeneratePdf();
    }

    private static void ComposeFilters(
        ColumnDescriptor column,
        IReadOnlyDictionary<string, string?> filters)
    {
        var labels = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["plate"] = "Placa",
            ["driverName"] = "Condutor",
            ["categoryName"] = "Categoria",
            ["vehicleIdentification"] = "Identificação",
            ["status"] = "Situação"
        };
        var applied = filters
            .Where(filter => !string.IsNullOrWhiteSpace(filter.Value))
            .Select(filter => $"{labels.GetValueOrDefault(filter.Key, filter.Key)}: {filter.Value}")
            .ToArray();

        column.Item().Text(applied.Length == 0
            ? "Filtros adicionais: nenhum"
            : $"Filtros adicionais: {string.Join(" · ", applied)}");
    }

    private void ComposeVehicleMovement(
        IContainer container,
        VehicleMovementReportItem item)
    {
        container
            .Border(1)
            .BorderColor(Colors.Grey.Lighten2)
            .Padding(10)
            .Column(column =>
            {
                column.Spacing(4);
                column.Item().Row(row =>
                {
                    row.RelativeItem().Text($"{item.Plate} — {item.DriverName}").Bold();
                    row.AutoItem().Text($"#{item.Id} · {item.Status}").SemiBold();
                });
                AddPair(column, "Entrada", FormatDateTime(item.EntryAtUtc),
                    "Saída", FormatDateTime(item.ExitAtUtc));
                AddPair(column, "Categoria", item.CategoryName,
                    "Tipo do veículo", ValueOrFallback(item.VehicleType));
                AddPair(column, "Objetivo", item.Objective,
                    "Evento", ValueOrFallback(item.EventName));
                AddPair(column, "Registrado por", FormatActor(item.EntryRecordedBy),
                    "Saída/encerramento por", FormatActor(item.ExitRecordedBy));
                AddPair(column, "Tipo de encerramento", ValueOrFallback(item.ClosureType),
                    "Situação", item.Status);
            });
    }

    private void ComposeInstitutionalFleet(
        IContainer container,
        InstitutionalFleetReportItem item)
    {
        var vehicle = string.Join(
            " · ",
            new[] { item.Plate, item.VehicleIdentification }
                .Where(value => !string.IsNullOrWhiteSpace(value)));
        container
            .Border(1)
            .BorderColor(Colors.Grey.Lighten2)
            .Padding(10)
            .Column(column =>
            {
                column.Spacing(4);
                column.Item().Row(row =>
                {
                    row.RelativeItem().Text(
                        $"{ValueOrFallback(vehicle)} — {item.DriverName}").Bold();
                    row.AutoItem().Text($"#{item.Id} · {item.Status}").SemiBold();
                });
                AddPair(column, "Saída", FormatDateTime(item.DepartureAtUtc),
                    "Retorno", FormatDateTime(item.ReturnAtUtc));
                AddPair(column, "Quilometragem de saída", FormatMileage(item.DepartureMileage),
                    "Quilometragem de retorno", FormatMileage(item.ReturnMileage));
                AddPair(column, "Distância registrada", FormatMileage(item.Distance),
                    "Situação", item.Status);
                AddPair(column, "Itinerário", item.Itinerary,
                    "Veículo", ValueOrFallback(vehicle));
                AddPair(column, "Saída registrada por", FormatActor(item.DepartureRecordedBy),
                    "Retorno registrado por", FormatActor(item.ReturnRecordedBy));
            });
    }

    private static void AddPair(
        ColumnDescriptor column,
        string firstLabel,
        string firstValue,
        string secondLabel,
        string secondValue) =>
        column.Item().Row(row =>
        {
            row.RelativeItem().Text(text =>
            {
                text.Span($"{firstLabel}: ").SemiBold();
                text.Span(firstValue);
            });
            row.ConstantItem(12);
            row.RelativeItem().Text(text =>
            {
                text.Span($"{secondLabel}: ").SemiBold();
                text.Span(secondValue);
            });
        });

    private string FormatDateTime(DateTime? value) => value.HasValue
        ? ToInstitutionalTime(value.Value).ToString("dd/MM/yyyy HH:mm", Culture)
        : "Não informado";

    private DateTime ToInstitutionalTime(DateTime value) =>
        TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(value, DateTimeKind.Utc),
            institutionalTimeZone);

    private static string FormatActor(ReportActor? actor) => actor is null
        ? "Não informado"
        : $"{actor.Name} ({actor.Profile})";

    private static string FormatMileage(int? mileage) => mileage.HasValue
        ? $"{mileage.Value.ToString("N0", Culture)} km"
        : "Não informado";

    private static string ValueOrFallback(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "Não informado" : value;
}
