import { useMemo } from "react";

import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { AccessHistoryRequestStatus } from "../hooks/useAccessHistory";
import type { AccessRecord, PagedAccessRecords } from "../types";

interface AccessHistoryResultsProps {
  errorMessage: string | null;
  requestStatus: AccessHistoryRequestStatus;
  result: PagedAccessRecords | null;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function stayDuration(record: AccessRecord) {
  if (!record.exitAtUtc) return "Em andamento";
  const minutes = Math.max(
    1,
    Math.round(
      (new Date(record.exitAtUtc).getTime() -
        new Date(record.entryAtUtc).getTime()) /
        60_000,
    ),
  );
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
}

export function AccessHistoryResults({
  errorMessage,
  requestStatus,
  result,
  onPageChange,
  onRetry,
}: AccessHistoryResultsProps) {
  const records = result?.items ?? [];
  const pageNumbers = useMemo(() => {
    if (!result || result.totalPages <= 1) return [];
    const start = Math.max(1, result.page - 2);
    const end = Math.min(result.totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [result]);

  return (
    <div
      className="border-t border-ink/8 p-5 sm:p-6"
      aria-busy={requestStatus === "loading"}
    >
      {errorMessage && requestStatus === "error" && (
        <div
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          <p>{errorMessage}</p>
          <button
            className="min-h-10 rounded-xl border border-red-300 px-4 font-bold"
            onClick={onRetry}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-ink">
            {result?.totalCount ?? 0} registro(s)
          </p>
          <p className="text-xs text-ink/55">
            Página {result?.page ?? 1} de {Math.max(1, result?.totalPages ?? 1)}
          </p>
        </div>
      </div>

      {requestStatus === "loading" ? (
        <div
          className="mt-5 rounded-2xl bg-cream/35 p-8 text-center"
          role="status"
        >
          Carregando histórico…
        </div>
      ) : records.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-ink/20 bg-cream/35 p-8 text-center">
          <p className="font-bold text-ink">Nenhum registro encontrado</p>
          <p className="mt-1 text-sm text-ink/60">
            Ajuste o período ou limpe os filtros para tentar novamente.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-3 lg:hidden">
            {records.map((record) => (
              <article
                className="rounded-2xl border border-ink/10 bg-cream/25 p-4"
                key={record.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-ink">{record.plate}</strong>
                    <span className="text-xs text-ink/60">
                      {record.categoryName} • #{record.id}
                    </span>
                  </div>
                  <StatusBadge
                    label={record.exitAtUtc ? "Concluído" : "Em aberto"}
                    tone={record.exitAtUtc ? "success" : "warning"}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink/80">
                  {record.driverName}
                </p>
                <p className="mt-1 text-sm text-ink/60">{record.objective}</p>
                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/8 pt-3 text-xs">
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-ink/50">
                      Entrada
                    </dt>
                    <dd className="mt-1 text-ink/75">
                      {dateFormatter.format(new Date(record.entryAtUtc))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-ink/50">
                      Permanência
                    </dt>
                    <dd className="mt-1 text-ink/75">{stayDuration(record)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Histórico de acessos retornado pela API
              </caption>
              <thead>
                <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.12em] text-ink/50">
                  <th className="px-3 py-3" scope="col">
                    Data e veículo
                  </th>
                  <th className="px-3 py-3" scope="col">
                    Condutor
                  </th>
                  <th className="px-3 py-3" scope="col">
                    Objetivo
                  </th>
                  <th className="px-3 py-3" scope="col">
                    Permanência
                  </th>
                  <th className="px-3 py-3" scope="col">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    className="border-b border-ink/6 align-top last:border-0 hover:bg-cream/25"
                    key={record.id}
                  >
                    <td className="px-3 py-4">
                      <strong className="block text-ink">{record.plate}</strong>
                      <span className="mt-1 block whitespace-nowrap text-xs text-ink/55">
                        {dateFormatter.format(new Date(record.entryAtUtc))}
                      </span>
                      <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-wider text-brand-dark">
                        {record.categoryName}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-ink/75">
                      {record.driverName}
                    </td>
                    <td className="px-3 py-4 text-ink/75">
                      {record.objective}
                    </td>
                    <td className="px-3 py-4 text-ink/70">
                      {stayDuration(record)}
                      {record.exitAtUtc && (
                        <span className="mt-1 block whitespace-nowrap text-xs text-ink/50">
                          Saída{" "}
                          {dateFormatter.format(new Date(record.exitAtUtc))}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge
                        label={record.exitAtUtc ? "Concluído" : "Em aberto"}
                        tone={record.exitAtUtc ? "success" : "warning"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pageNumbers.length > 0 && result && (
        <nav
          aria-label="Paginação do histórico"
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          <button
            className="min-h-10 rounded-xl border border-ink/15 px-3 text-sm font-bold disabled:opacity-40"
            disabled={result.page <= 1 || requestStatus === "loading"}
            onClick={() => onPageChange(result.page - 1)}
            type="button"
          >
            Anterior
          </button>
          {pageNumbers.map((page) => (
            <button
              aria-current={result.page === page ? "page" : undefined}
              className={`min-h-10 min-w-10 rounded-xl border px-3 text-sm font-bold ${result.page === page ? "border-ink bg-ink text-white" : "border-ink/15"}`}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          ))}
          <button
            className="min-h-10 rounded-xl border border-ink/15 px-3 text-sm font-bold disabled:opacity-40"
            disabled={
              result.page >= result.totalPages || requestStatus === "loading"
            }
            onClick={() => onPageChange(result.page + 1)}
            type="button"
          >
            Próxima
          </button>
        </nav>
      )}
    </div>
  );
}
