import { useEffect, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatElapsedTime } from "../model/openAccessTime";
import { getVehiclePresentation } from "../model/vehicleTypePresentation";
import type { AccessRecord } from "../types";
import { VehicleTypeIndicator } from "./VehicleTypeIndicator";

interface OpenAccessListProps {
  canExceptionallyClose: boolean;
  closingId: number | null;
  closingOperation: "normal" | "exceptional" | null;
  onExit: (record: AccessRecord, trigger: HTMLButtonElement) => void;
  onExceptionalClosure: (
    record: AccessRecord,
    trigger: HTMLButtonElement,
  ) => void;
  records: AccessRecord[];
}

const entryFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function OpenAccessList({
  canExceptionallyClose,
  closingId,
  closingOperation,
  onExit,
  onExceptionalClosure,
  records,
}: OpenAccessListProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const exitLabel = (record: AccessRecord) =>
    `Registrar saída de ${record.plate}, condutor ${record.driverName}`;

  const elapsed = (record: AccessRecord) =>
    formatElapsedTime(record.entryAtUtc, now);

  return (
    <>
      <div
        className="mt-4 grid gap-3 md:grid-cols-2 2xl:hidden"
        data-testid="open-access-cards"
      >
        {records.map((record) => {
          const vehicle = getVehiclePresentation(record.vehicleType);

          return (
            <article
              className="open-access-record-card rounded-xl border border-border bg-surface p-4 shadow-sm"
              key={record.id}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <VehicleTypeIndicator
                    iconSize={24}
                    showLabel={false}
                    vehicleType={record.vehicleType}
                  />
                  <div className="min-w-0">
                    <strong className="block font-mono text-xl font-extrabold uppercase leading-none tracking-[0.08em] text-ink">
                      {record.plate}
                    </strong>
                    <p className="mt-1 text-xs font-semibold text-ink-soft">
                      {vehicle.label}
                    </p>
                  </div>
                </div>
                <StatusBadge label="Em aberto" tone="warning" />
              </div>
              <p className="mt-3 break-words text-sm font-semibold text-ink">
                {record.driverName}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3 text-xs">
                <div className="col-span-2">
                  <dt className="font-bold uppercase tracking-wider text-ink-soft">
                    Categoria
                  </dt>
                  <dd className="mt-0.5 break-words text-ink-soft">
                    {record.categoryName}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-wider text-ink-soft">
                    Entrada
                  </dt>
                  <dd className="mt-0.5 text-ink-soft">
                    {entryFormatter.format(new Date(record.entryAtUtc))}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-wider text-ink-soft">
                    Tempo transcorrido
                  </dt>
                  <dd className="mt-0.5 font-semibold text-ink">
                    {elapsed(record)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-2">
                <Button
                  aria-label={exitLabel(record)}
                  className="w-full"
                  disabled={closingId !== null}
                  onClick={(event) => onExit(record, event.currentTarget)}
                  type="button"
                >
                  <Icon name="log-out" size={18} />
                  {closingId === record.id && closingOperation === "normal"
                    ? "Registrando saída…"
                    : "Registrar saída"}
                </Button>
                {canExceptionallyClose && (
                  <Button
                    aria-label={`Regularizar saída não registrada de ${record.plate}, condutor ${record.driverName}`}
                    className="w-full"
                    disabled={closingId !== null}
                    onClick={(event) =>
                      onExceptionalClosure(record, event.currentTarget)
                    }
                    type="button"
                    variant="secondary"
                  >
                    <Icon name="clipboard" size={18} />
                    {closingId === record.id &&
                    closingOperation === "exceptional"
                      ? "Regularizando…"
                      : "Regularizar saída não registrada"}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div
        className="open-access-table-shell mt-4 hidden overflow-hidden rounded-xl border border-border 2xl:block"
        data-testid="open-access-table"
      >
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">
            Acessos em aberto retornados pela API
          </caption>
          <thead>
            <tr className="open-access-table-heading border-b border-border bg-surface-subtle text-[0.68rem] uppercase tracking-[0.12em] text-text-muted">
              <th className="w-[12%] px-3 py-3" scope="col">
                Tipo
              </th>
              <th className="w-[10%] px-3 py-3" scope="col">
                Placa
              </th>
              <th className="w-[17%] px-3 py-3" scope="col">
                Condutor
              </th>
              <th className="w-[13%] px-3 py-3" scope="col">
                Categoria
              </th>
              <th className="w-[14%] px-3 py-3" scope="col">
                Entrada
              </th>
              <th className="w-[11%] px-3 py-3" scope="col">
                Tempo transcorrido
              </th>
              <th className="w-[23%] px-3 py-3 text-center" scope="col">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              return (
                <tr
                  className="open-access-table-row border-b border-border align-middle last:border-0 hover:bg-surface-subtle"
                  key={record.id}
                >
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2.5">
                      <VehicleTypeIndicator vehicleType={record.vehicleType} />
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <strong className="font-mono text-base font-extrabold uppercase tracking-[0.08em] text-ink">
                      {record.plate}
                    </strong>
                  </td>
                  <td className="break-words px-3 py-4 font-semibold text-ink">
                    {record.driverName}
                  </td>
                  <td className="break-words px-3 py-4 text-ink-soft">
                    <span className="inline-flex rounded-full border border-success-border bg-success-surface px-2.5 py-1 text-xs font-semibold text-success-text">
                      {record.categoryName}
                    </span>
                  </td>
                  <td className="px-3 py-4 tabular-nums text-ink-soft">
                    {entryFormatter.format(new Date(record.entryAtUtc))}
                  </td>
                  <td className="px-3 py-4 font-semibold tabular-nums text-ink">
                    {elapsed(record)}
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="mx-auto flex w-full max-w-64 flex-col items-stretch gap-2">
                      <Button
                        aria-label={exitLabel(record)}
                        className="w-full justify-center whitespace-normal text-center text-xs leading-snug"
                        disabled={closingId !== null}
                        onClick={(event) => onExit(record, event.currentTarget)}
                        type="button"
                      >
                        <Icon name="log-out" size={17} />
                        {closingId === record.id &&
                        closingOperation === "normal"
                          ? "Registrando…"
                          : "Registrar saída"}
                      </Button>
                      {canExceptionallyClose && (
                        <Button
                          aria-label={`Regularizar saída não registrada de ${record.plate}, condutor ${record.driverName}`}
                          className="w-full justify-center whitespace-normal text-center text-xs leading-snug"
                          disabled={closingId !== null}
                          onClick={(event) =>
                            onExceptionalClosure(record, event.currentTarget)
                          }
                          type="button"
                          variant="secondary"
                        >
                          <Icon name="clipboard" size={17} />
                          {closingId === record.id &&
                          closingOperation === "exceptional"
                            ? "Regularizando…"
                            : "Regularizar saída não registrada"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
