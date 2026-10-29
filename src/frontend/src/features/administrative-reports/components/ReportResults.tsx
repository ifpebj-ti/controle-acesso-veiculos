import type {
  AdministrativeReportKind,
  AdministrativeReportResultPage,
  InstitutionalFleetReportItem,
  VehicleMovementReportItem,
} from "../types";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { FleetReportResults } from "./FleetReportResults";
import { MovementReportResults } from "./MovementReportResults";
import { ReportPagination } from "./ReportPagination";

export function ReportResults({
  kind,
  onPageChange,
  page,
}: {
  kind: AdministrativeReportKind;
  onPageChange: (page: number) => void;
  page: AdministrativeReportResultPage;
}) {
  return (
    <section
      aria-labelledby="report-results-title"
      className="institutional-catalog mt-5 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(1,36,40,0.035)]"
    >
      <div className="px-5 pt-5 sm:px-6">
        <SectionHeader
          description={`${page.totalCount} registro(s) no período selecionado.`}
          eyebrow="Resultados da consulta"
          meta={
            <p>
              Período: <strong>{page.from}</strong> a <strong>{page.to}</strong>
              <span aria-hidden="true"> · </span>
              <span className="whitespace-nowrap">Fuso: {page.timeZoneId}</span>
            </p>
          }
          title={
            kind === "movements"
              ? "Movimentações encontradas"
              : "Utilizações encontradas"
          }
          titleId="report-results-title"
        />
      </div>
      {kind === "movements" ? (
        <MovementReportResults
          items={page.items as VehicleMovementReportItem[]}
          timeZone={page.timeZoneId}
        />
      ) : (
        <FleetReportResults
          items={page.items as InstitutionalFleetReportItem[]}
          timeZone={page.timeZoneId}
        />
      )}
      <ReportPagination onPageChange={onPageChange} page={page} />
    </section>
  );
}
