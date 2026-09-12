import { useEffect, useState } from "react";

import { formatElapsedTime } from "../model/openAccessTime";
import type { AccessRecord } from "../types";

interface OpenAccessListProps {
  closingId: number | null;
  onExit: (record: AccessRecord, trigger: HTMLButtonElement) => void;
  records: AccessRecord[];
}

const entryFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function OpenAccessList({
  closingId,
  onExit,
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
      <div className="mt-4 space-y-3 lg:hidden" data-testid="open-access-cards">
        {records.map((record) => (
          <article
            className="rounded-2xl border border-ink/10 bg-cream/25 p-4"
            key={record.id}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block font-display text-2xl leading-none text-ink">
                  {record.plate}
                </strong>
                <p className="mt-2 break-words text-sm font-semibold text-ink/80">
                  {record.driverName}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#FFE67C]/55 px-2.5 py-1 text-xs font-bold text-ink">
                Em aberto
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-ink/8 pt-3 text-xs">
              <div className="col-span-2">
                <dt className="font-bold uppercase tracking-wider text-ink/50">
                  Categoria
                </dt>
                <dd className="mt-0.5 break-words text-ink/75">
                  {record.categoryName}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wider text-ink/50">
                  Entrada
                </dt>
                <dd className="mt-0.5 text-ink/75">
                  {entryFormatter.format(new Date(record.entryAtUtc))}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wider text-ink/50">
                  Tempo transcorrido
                </dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {elapsed(record)}
                </dd>
              </div>
            </dl>
            <button
              aria-label={exitLabel(record)}
              className="mt-4 min-h-11 w-full rounded-xl bg-brand-dark px-4 text-sm font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/45 disabled:cursor-wait disabled:opacity-65"
              disabled={closingId !== null}
              onClick={(event) => onExit(record, event.currentTarget)}
              type="button"
            >
              {closingId === record.id
                ? "Registrando saída…"
                : "Registrar saída"}
            </button>
          </article>
        ))}
      </div>

      <div className="mt-4 hidden lg:block" data-testid="open-access-table">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">
            Acessos em aberto retornados pela API
          </caption>
          <thead>
            <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.12em] text-ink/55">
              <th className="w-[14%] px-3 py-3" scope="col">
                Placa
              </th>
              <th className="w-[22%] px-3 py-3" scope="col">
                Condutor
              </th>
              <th className="w-[18%] px-3 py-3" scope="col">
                Categoria
              </th>
              <th className="w-[18%] px-3 py-3" scope="col">
                Entrada
              </th>
              <th className="w-[15%] px-3 py-3" scope="col">
                Tempo transcorrido
              </th>
              <th className="w-[13%] px-3 py-3 text-right" scope="col">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                className="border-b border-ink/6 align-middle last:border-0 hover:bg-cream/30"
                key={record.id}
              >
                <td className="px-3 py-3">
                  <strong className="font-display text-lg text-ink">
                    {record.plate}
                  </strong>
                </td>
                <td className="break-words px-3 py-3 font-semibold text-ink/80">
                  {record.driverName}
                </td>
                <td className="break-words px-3 py-3 text-ink/70">
                  {record.categoryName}
                </td>
                <td className="px-3 py-3 text-ink/70">
                  {entryFormatter.format(new Date(record.entryAtUtc))}
                </td>
                <td className="px-3 py-3 font-semibold text-ink">
                  {elapsed(record)}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    aria-label={exitLabel(record)}
                    className="min-h-10 whitespace-nowrap rounded-xl bg-brand-dark px-3 text-xs font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/45 disabled:cursor-wait disabled:opacity-65"
                    disabled={closingId !== null}
                    onClick={(event) => onExit(record, event.currentTarget)}
                    type="button"
                  >
                    {closingId === record.id
                      ? "Registrando…"
                      : "Registrar saída"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
