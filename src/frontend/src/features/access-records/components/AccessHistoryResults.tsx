import { useMemo } from "react";

import { ContentState } from "../../../components/ui/ContentState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { AccessHistoryRequestStatus } from "../hooks/useAccessHistory";
import {
  exceptionalClosureReasonLabels,
  exceptionalClosureReasons,
} from "../model/exceptionalClosure";
import type { AccessRecord, PagedAccessRecords } from "../types";

interface AccessHistoryResultsProps {
  errorMessage: string | null;
  requestStatus: AccessHistoryRequestStatus;
  result: PagedAccessRecords | null;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onCorrect?: (record: AccessRecord, trigger: HTMLButtonElement) => void;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function stayDuration(record: AccessRecord) {
  if (!record.exitAtUtc) {
    return isExceptionalClosure(record)
      ? "Horário de saída desconhecido"
      : "Em andamento";
  }
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

function isExceptionalClosure(record: AccessRecord) {
  return record.closureType?.toLocaleLowerCase("pt-BR") === "excepcional";
}

function closureStatus(record: AccessRecord) {
  if (isExceptionalClosure(record)) {
    return { label: "Encerramento excepcional", tone: "warning" as const };
  }
  if (record.exitAtUtc) {
    return { label: "Saída normal", tone: "success" as const };
  }
  return { label: "Em aberto", tone: "warning" as const };
}

function exceptionalReasonLabel(record: AccessRecord) {
  const reason = record.exceptionalClosureReason;
  if (!reason) return null;
  return exceptionalClosureReasons.includes(
    reason as (typeof exceptionalClosureReasons)[number],
  )
    ? exceptionalClosureReasonLabels[
        reason as (typeof exceptionalClosureReasons)[number]
      ]
    : reason;
}

function ExceptionalClosureDetails({ record }: { record: AccessRecord }) {
  if (!isExceptionalClosure(record)) return null;
  const reason = exceptionalReasonLabel(record);

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-ink">
      <p className="font-bold">Regularização excepcional</p>
      <p className="mt-1">
        {record.exitAtUtc
          ? `Saída observada: ${dateFormatter.format(new Date(record.exitAtUtc))}`
          : "Saída observada: horário desconhecido"}
      </p>
      {record.regularizedAtUtc && (
        <p>
          Regularizado em:{" "}
          {dateFormatter.format(new Date(record.regularizedAtUtc))}
        </p>
      )}
      {reason && <p>Motivo: {reason}</p>}
      {record.exceptionalClosureObservation?.trim() && (
        <p className="break-words">
          Observação: {record.exceptionalClosureObservation}
        </p>
      )}
    </div>
  );
}

function linkedEventName(record: AccessRecord) {
  return record.eventAuthorizationName?.trim() || null;
}

export function AccessHistoryResults({
  errorMessage,
  requestStatus,
  result,
  onPageChange,
  onRetry,
  onCorrect,
}: AccessHistoryResultsProps) {
  const records = result?.items ?? [];
  const pageNumbers = useMemo(() => {
    if (!result || result.totalPages <= 1) return [];
    const start = Math.max(1, result.page - 2);
    const end = Math.min(result.totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [result]);

  if (requestStatus === "error") {
    return (
      <div className="border-t border-ink/8 p-5 sm:p-6">
        <ContentState
          action={
            <button
              className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-700/30"
              onClick={onRetry}
              type="button"
            >
              Tentar novamente
            </button>
          }
          title={errorMessage ?? "Não foi possível consultar o histórico."}
          variant="error"
        />
      </div>
    );
  }

  if (requestStatus === "loading") {
    return (
      <div className="border-t border-ink/8 p-5 sm:p-6" aria-busy="true">
        <ContentState title="Carregando histórico…" variant="loading" />
      </div>
    );
  }

  return (
    <div className="border-t border-ink/8 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-ink">
            {result?.totalCount ?? 0} registro(s)
          </p>
          <p className="text-xs text-ink-soft">
            Página {result?.page ?? 1} de {Math.max(1, result?.totalPages ?? 1)}
          </p>
        </div>
      </div>

      {records.length === 0 ? (
        <ContentState
          className="mt-5"
          description="Ajuste o período ou limpe os filtros para tentar novamente."
          icon="history"
          title="Nenhum registro encontrado"
          variant="empty"
        />
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:hidden">
            {records.map((record) => (
              <article
                className="rounded-2xl border border-ink/10 bg-cream/25 p-4"
                key={record.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-ink">{record.plate}</strong>
                    <span className="text-xs text-ink-soft">
                      {record.categoryName} • #{record.id}
                    </span>
                  </div>
                  <StatusBadge {...closureStatus(record)} />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink-soft">
                  {record.driverName}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{record.objective}</p>
                {linkedEventName(record) && (
                  <p className="mt-2 text-sm text-ink-soft">
                    <span className="font-bold text-ink">Evento:</span>{" "}
                    {linkedEventName(record)}
                  </p>
                )}
                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/8 pt-3 text-xs">
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-ink-soft">
                      Entrada
                    </dt>
                    <dd className="mt-1 text-ink-soft">
                      {dateFormatter.format(new Date(record.entryAtUtc))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-ink-soft">
                      Permanência
                    </dt>
                    <dd className="mt-1 text-ink-soft">
                      {stayDuration(record)}
                    </dd>
                  </div>
                </dl>
                <ExceptionalClosureDetails record={record} />
                {onCorrect && (
                  <button
                    aria-label={`Corrigir registro ${record.plate} de ${record.driverName}`}
                    className="mt-4 min-h-11 w-full rounded-xl border border-brand-dark px-4 text-sm font-bold text-brand-dark hover:bg-white focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30"
                    onClick={(event) => onCorrect(record, event.currentTarget)}
                    type="button"
                  >
                    Corrigir registro
                  </button>
                )}
              </article>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Histórico de acessos retornado pela API
              </caption>
              <thead>
                <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.12em] text-ink-soft">
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
                  {onCorrect && (
                    <th className="px-3 py-3" scope="col">
                      Ações
                    </th>
                  )}
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
                      <span className="mt-1 block whitespace-nowrap text-xs text-ink-soft">
                        {dateFormatter.format(new Date(record.entryAtUtc))}
                      </span>
                      <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-wider text-brand-dark">
                        {record.categoryName}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-ink-soft">
                      {record.driverName}
                    </td>
                    <td className="px-3 py-4 text-ink-soft">
                      {record.objective}
                      {linkedEventName(record) && (
                        <span className="mt-2 block text-xs text-ink-soft">
                          <strong className="text-ink">Evento:</strong>{" "}
                          {linkedEventName(record)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-ink-soft">
                      {stayDuration(record)}
                      {record.exitAtUtc && !isExceptionalClosure(record) && (
                        <span className="mt-1 block whitespace-nowrap text-xs text-ink-soft">
                          Saída{" "}
                          {dateFormatter.format(new Date(record.exitAtUtc))}
                        </span>
                      )}
                      <ExceptionalClosureDetails record={record} />
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge {...closureStatus(record)} />
                    </td>
                    {onCorrect && (
                      <td className="px-3 py-4">
                        <button
                          aria-label={`Corrigir registro ${record.plate} de ${record.driverName}`}
                          className="min-h-10 whitespace-nowrap rounded-xl border border-brand-dark px-3 text-xs font-bold text-brand-dark hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30"
                          onClick={(event) =>
                            onCorrect(record, event.currentTarget)
                          }
                          type="button"
                        >
                          Corrigir registro
                        </button>
                      </td>
                    )}
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
            disabled={result.page <= 1}
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
            disabled={result.page >= result.totalPages}
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
