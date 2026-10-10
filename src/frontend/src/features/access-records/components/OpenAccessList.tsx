import { useEffect, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatElapsedTime } from "../model/openAccessTime";
import type { AccessRecord } from "../types";

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
        className="mt-4 grid gap-3 md:grid-cols-2 xl:hidden"
        data-testid="open-access-cards"
      >
        {records.map((record) => (
          <article
            className="rounded-xl border border-border bg-surface-subtle p-4"
            key={record.id}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block font-mono text-xl font-extrabold uppercase leading-none tracking-[0.08em] text-ink">
                  {record.plate}
                </strong>
                <p className="mt-2 break-words text-sm font-semibold text-ink-soft">
                  {record.driverName}
                </p>
              </div>
              <StatusBadge label="Em aberto" tone="warning" />
            </div>
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
                  {closingId === record.id && closingOperation === "exceptional"
                    ? "Regularizando…"
                    : "Regularizar saída não registrada"}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      <div
        className="mt-4 hidden overflow-hidden rounded-xl border border-border xl:block"
        data-testid="open-access-table"
      >
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">
            Acessos em aberto retornados pela API
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface-subtle text-[0.68rem] uppercase tracking-[0.12em] text-text-muted">
              <th className="w-[15%] px-4 py-3" scope="col">
                Placa
              </th>
              <th className="w-[21%] px-4 py-3" scope="col">
                Condutor
              </th>
              <th className="w-[15%] px-4 py-3" scope="col">
                Categoria
              </th>
              <th className="w-[16%] px-4 py-3" scope="col">
                Entrada
              </th>
              <th className="w-[13%] px-4 py-3" scope="col">
                Tempo transcorrido
              </th>
              <th className="w-[20%] px-4 py-3 text-right" scope="col">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                className="border-b border-border align-middle even:bg-surface-subtle last:border-0 hover:bg-surface-subtle"
                key={record.id}
              >
                <td className="px-4 py-4">
                  <strong className="font-mono text-base font-extrabold uppercase tracking-[0.08em] text-ink">
                    {record.plate}
                  </strong>
                </td>
                <td className="break-words px-4 py-4 font-semibold text-ink">
                  {record.driverName}
                </td>
                <td className="break-words px-4 py-4 text-ink-soft">
                  <span className="inline-flex rounded-full border border-border bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-text">
                    {record.categoryName}
                  </span>
                </td>
                <td className="px-4 py-4 tabular-nums text-ink-soft">
                  {entryFormatter.format(new Date(record.entryAtUtc))}
                </td>
                <td className="px-4 py-4 font-semibold tabular-nums text-ink">
                  {elapsed(record)}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      aria-label={exitLabel(record)}
                      className="whitespace-nowrap text-xs"
                      disabled={closingId !== null}
                      onClick={(event) => onExit(record, event.currentTarget)}
                      type="button"
                    >
                      {closingId === record.id && closingOperation === "normal"
                        ? "Registrando…"
                        : "Registrar saída"}
                    </Button>
                    {canExceptionallyClose && (
                      <Button
                        aria-label={`Regularizar saída não registrada de ${record.plate}, condutor ${record.driverName}`}
                        className="whitespace-nowrap text-xs"
                        disabled={closingId !== null}
                        onClick={(event) =>
                          onExceptionalClosure(record, event.currentTarget)
                        }
                        type="button"
                        variant="secondary"
                      >
                        {closingId === record.id &&
                        closingOperation === "exceptional"
                          ? "Regularizando…"
                          : "Regularizar saída não registrada"}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
