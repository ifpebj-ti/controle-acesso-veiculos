import type { ReactNode } from "react";

import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatReportActor,
  formatReportDateTime,
} from "../model/reportPresentation";
import type { VehicleMovementReportItem } from "../types";
import { VehicleIdentity } from "./VehicleIdentity";

function statusTone(status: VehicleMovementReportItem["status"]) {
  return status === "Encerrado"
    ? ("success" as const)
    : status === "Pendente"
      ? ("warning" as const)
      : ("neutral" as const);
}

export function MovementReportResults({
  items,
  timeZone,
}: {
  items: VehicleMovementReportItem[];
  timeZone: string;
}) {
  return (
    <>
      <ul className="grid gap-3 p-5 sm:p-6 min-[1800px]:hidden">
        {items.map((item) => (
          <li
            className="overflow-hidden rounded-2xl border border-border bg-surface"
            key={item.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-subtle px-4 py-3 sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Movimentação #{item.id}
              </p>
              <StatusBadge label={item.status} tone={statusTone(item.status)} />
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
                  <strong>Categoria:</strong> {item.categoryName}
                </p>
                <p>
                  <strong>Tipo de veículo:</strong>{" "}
                  {item.vehicleType ?? "Não informado"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Entrada:</strong>{" "}
                  {formatReportDateTime(item.entryAtUtc, timeZone)}
                </p>
                <p>
                  <strong>Saída:</strong>{" "}
                  {formatReportDateTime(item.exitAtUtc, timeZone)}
                </p>
              </div>
              <div>
                <p>
                  <strong>Objetivo:</strong> {item.objective}
                </p>
                {item.eventName && (
                  <p>
                    <strong>Evento:</strong> {item.eventName}
                  </p>
                )}
                {item.closureType && (
                  <p>
                    <strong>Encerramento:</strong> {item.closureType}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-1 border-t border-border bg-surface-subtle px-4 py-3 text-sm text-text-muted sm:px-5 sm:grid-cols-2">
              <p>
                <strong>Entrada registrada por:</strong>{" "}
                {formatReportActor(item.entryRecordedBy)}
              </p>
              <p>
                <strong>Saída registrada por:</strong>{" "}
                {formatReportActor(item.exitRecordedBy)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden px-5 pb-5 pt-4 sm:px-6 min-[1800px]:block">
        <table className="w-full table-fixed overflow-hidden rounded-xl border-separate border-spacing-0 border border-border text-left text-xs leading-5">
          <caption className="sr-only">
            Relatório de movimentações gerais de veículos
          </caption>
          <thead className="bg-surface-subtle text-text">
            <tr>
              <ReportHeading className="w-[12%]">Entrada</ReportHeading>
              <ReportHeading className="w-[13%]">Veículo</ReportHeading>
              <ReportHeading className="w-[13%]">Condutor</ReportHeading>
              <ReportHeading className="w-[20%]">Contexto</ReportHeading>
              <ReportHeading className="w-[12%]">Saída</ReportHeading>
              <ReportHeading className="w-[21%]">Responsáveis</ReportHeading>
              <ReportHeading className="w-[9%]">Situação</ReportHeading>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="align-top last:[&>td]:border-b-0" key={item.id}>
                <ReportCell>
                  {formatReportDateTime(item.entryAtUtc, timeZone)}
                  <small className="mt-1 block text-text-muted">
                    Registro #{item.id}
                  </small>
                </ReportCell>
                <ReportCell>
                  <strong className="block">{item.plate ?? "Sem placa"}</strong>
                  {item.vehicleIdentification && (
                    <span className="mt-1 block text-text-muted">
                      ID: {item.vehicleIdentification}
                    </span>
                  )}
                  <span className="mt-1 block text-text-muted">
                    {item.vehicleType ?? "Tipo não informado"}
                  </span>
                </ReportCell>
                <ReportCell>{item.driverName}</ReportCell>
                <ReportCell>
                  <strong className="block">{item.categoryName}</strong>
                  <span className="mt-1 block">{item.objective}</span>
                  {item.eventName && (
                    <span className="mt-1 block text-text-muted">
                      Evento: {item.eventName}
                    </span>
                  )}
                </ReportCell>
                <ReportCell>
                  {formatReportDateTime(item.exitAtUtc, timeZone)}
                  {item.closureType && (
                    <span className="mt-1 block text-text-muted">
                      {item.closureType}
                    </span>
                  )}
                </ReportCell>
                <ReportCell>
                  <strong className="block">Entrada</strong>
                  {formatReportActor(item.entryRecordedBy)}
                  <strong className="mt-2 block">Saída</strong>
                  {formatReportActor(item.exitRecordedBy)}
                </ReportCell>
                <ReportCell>
                  <span className="whitespace-nowrap">
                    <StatusBadge
                      label={item.status}
                      tone={statusTone(item.status)}
                    />
                  </span>
                </ReportCell>
              </tr>
            ))}
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
