import type {
  AdministrativeReportKind,
  AdministrativeReportResultPage,
  InstitutionalFleetReportItem,
  VehicleMovementReportItem,
} from "../types";
import { FleetReportResults } from "./FleetReportResults";
import { MovementReportResults } from "./MovementReportResults";

export function ReportResults({
  kind,
  page,
}: {
  kind: AdministrativeReportKind;
  page: AdministrativeReportResultPage;
}) {
  return (
    <section aria-labelledby="report-results-title" className="mt-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold text-text" id="report-results-title">
          Registros encontrados
        </h2>
        <p className="text-sm text-text-muted">Fuso: {page.timeZoneId}</p>
      </div>
      <ul className="mt-3 grid gap-3">
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
      </ul>
    </section>
  );
}
