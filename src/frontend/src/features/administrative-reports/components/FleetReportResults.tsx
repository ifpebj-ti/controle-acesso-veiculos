import type { ReactNode } from "react";

import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatReportActor,
  formatReportDateTime,
} from "../model/reportPresentation";
import type { InstitutionalFleetReportItem } from "../types";
import { VehicleIdentity } from "./VehicleIdentity";

function statusPresentation(status: InstitutionalFleetReportItem["status"]) {
  if (status === "EmUso") return { label: "Em uso", tone: "neutral" as const };
  if (status === "PendenteRetorno") {
    return { label: "Pendente de retorno", tone: "warning" as const };
  }
  if (status === "Concluido") {
    return { label: "Concluído", tone: "success" as const };
  }
  return { label: "Corrigido", tone: "neutral" as const };
}

export function FleetReportResults({
  items,
  timeZone,
}: {
  items: InstitutionalFleetReportItem[];
  timeZone: string;
}) {
  return (
    <>
      <ul className="grid gap-3 p-5 sm:p-6 min-[1800px]:hidden">
        {items.map((item) => {
          const status = statusPresentation(item.status);
          return (
            <li
              className="overflow-hidden rounded-2xl border border-border bg-surface"
              key={item.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-subtle px-4 py-3 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Utilização #{item.id}
                </p>
                <StatusBadge label={status.label} tone={status.tone} />
              </div>
              <div className="grid min-w-0 gap-4 p-4 text-sm leading-6 sm:grid-cols-2 sm:p-5">
                <VehicleIdentity
                  plate={item.plate}
                  vehicleIdentification={item.vehicleIdentification}
                />
                <div>
                  <p>
                    <strong>Condutor:</strong> {item.driverName}
                  </p>
                  <p>
                    <strong>Itinerário:</strong> {item.itinerary}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Saída:</strong>{" "}
                    {formatReportDateTime(item.departureAtUtc, timeZone)}
                  </p>
                  <p>
                    <strong>Retorno:</strong>{" "}
                    {formatReportDateTime(item.returnAtUtc, timeZone)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Quilometragem:</strong> {item.departureMileage} km →{" "}
                    {item.returnMileage ?? "Não registrada"}
                    {item.returnMileage === null ? "" : " km"}
                  </p>
                  <p>
                    <strong>Distância:</strong>{" "}
                    {item.distance === null
                      ? "Não calculada"
                      : `${item.distance} km`}
                  </p>
                </div>
              </div>
              <div className="grid gap-1 border-t border-border bg-surface-subtle px-4 py-3 text-sm text-text-muted sm:px-5 sm:grid-cols-2">
                <p>
                  <strong>Saída registrada por:</strong>{" "}
                  {formatReportActor(item.departureRecordedBy)}
                </p>
                <p>
                  <strong>Retorno registrado por:</strong>{" "}
                  {formatReportActor(item.returnRecordedBy)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden px-5 pb-5 pt-4 sm:px-6 min-[1800px]:block">
        <table className="w-full table-fixed overflow-hidden rounded-xl border-separate border-spacing-0 border border-border text-left text-xs leading-5">
          <caption className="sr-only">
            Relatório de utilizações da frota institucional
          </caption>
          <thead className="bg-surface-subtle text-text">
            <tr>
              <ReportHeading className="w-[12%]">Saída</ReportHeading>
              <ReportHeading className="w-[12%]">Veículo</ReportHeading>
              <ReportHeading className="w-[20%]">Utilização</ReportHeading>
              <ReportHeading className="w-[12%]">Retorno</ReportHeading>
              <ReportHeading className="w-[12%]">Quilometragem</ReportHeading>
              <ReportHeading className="w-[20%]">Responsáveis</ReportHeading>
              <ReportHeading className="w-[12%]">Situação</ReportHeading>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const status = statusPresentation(item.status);
              return (
                <tr className="align-top last:[&>td]:border-b-0" key={item.id}>
                  <ReportCell>
                    {formatReportDateTime(item.departureAtUtc, timeZone)}
                    <small className="mt-1 block text-text-muted">
                      Registro #{item.id}
                    </small>
                  </ReportCell>
                  <ReportCell>
                    <strong className="block">
                      {item.plate ?? "Sem placa"}
                    </strong>
                    {item.vehicleIdentification && (
                      <span className="mt-1 block text-text-muted">
                        ID: {item.vehicleIdentification}
                      </span>
                    )}
                  </ReportCell>
                  <ReportCell>
                    <strong className="block">{item.driverName}</strong>
                    <span className="mt-1 block text-text-muted">
                      {item.itinerary}
                    </span>
                  </ReportCell>
                  <ReportCell>
                    {formatReportDateTime(item.returnAtUtc, timeZone)}
                  </ReportCell>
                  <ReportCell>
                    {item.departureMileage} km →{" "}
                    {item.returnMileage === null
                      ? "Não registrada"
                      : `${item.returnMileage} km`}
                    <span className="mt-1 block text-text-muted">
                      Distância:{" "}
                      {item.distance === null
                        ? "não calculada"
                        : `${item.distance} km`}
                    </span>
                  </ReportCell>
                  <ReportCell>
                    <strong className="block">Saída</strong>
                    {formatReportActor(item.departureRecordedBy)}
                    <strong className="mt-2 block">Retorno</strong>
                    {formatReportActor(item.returnRecordedBy)}
                  </ReportCell>
                  <ReportCell>
                    <span className="whitespace-nowrap">
                      <StatusBadge label={status.label} tone={status.tone} />
                    </span>
                  </ReportCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ReportHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border-b border-r border-border px-4 py-3 font-bold uppercase tracking-wide last:border-r-0 ${className}`}
      scope="col"
    >
      {children}
    </th>
  );
}

function ReportCell({ children }: { children: ReactNode }) {
  return (
    <td className="break-words border-b border-r border-border px-4 py-4 text-text last:border-r-0">
      {children}
    </td>
  );
}
