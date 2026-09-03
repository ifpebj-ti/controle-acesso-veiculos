import type { FormEvent } from "react";

import { generalAccessCategories } from "../model/accessCategories";
import type {
  AccessHistoryFilterDraft,
  AccessHistoryRequestStatus,
  PeriodPreset,
} from "../hooks/useAccessHistory";

interface AccessHistoryFiltersProps {
  draft: AccessHistoryFilterDraft;
  requestStatus: AccessHistoryRequestStatus;
  onApply: () => void;
  onClear: () => void;
  onDraftChange: (draft: AccessHistoryFilterDraft) => void;
  onPeriodChange: (period: PeriodPreset) => void;
}

const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-ink/18 bg-cream/45 px-3.5 text-sm text-ink outline-none focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

export function AccessHistoryFilters({
  draft,
  requestStatus,
  onApply,
  onClear,
  onDraftChange,
  onPeriodChange,
}: AccessHistoryFiltersProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onApply();
  }

  function update(values: Partial<AccessHistoryFilterDraft>) {
    onDraftChange({ ...draft, ...values });
  }

  return (
    <form onSubmit={submit}>
      <div className="border-b border-ink/8 bg-[#B8C9A4]/20 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Filtros da consulta
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Encontre um registro
            </h2>
          </div>
          <button
            className="min-h-10 rounded-xl px-3 text-sm font-bold text-brand-dark hover:bg-white focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
            onClick={onClear}
            type="button"
          >
            Limpar filtros
          </button>
        </div>

        <fieldset className="mt-5">
          <legend className="text-xs font-bold uppercase tracking-[0.12em] text-ink/55">
            Período
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["7", "7 dias"],
              ["30", "30 dias"],
              ["90", "90 dias"],
              ["365", "12 meses"],
              ["custom", "Personalizado"],
            ].map(([value, label]) => (
              <button
                aria-pressed={draft.period === value}
                className={`min-h-9 rounded-full border px-3.5 text-xs font-bold transition ${
                  draft.period === value
                    ? "border-ink bg-ink text-white"
                    : "border-ink/15 bg-white/75 text-ink/70 hover:border-ink/35"
                }`}
                key={value}
                onClick={() => onPeriodChange(value as PeriodPreset)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="history-plate"
            >
              Placa
            </label>
            <input
              className={fieldClass}
              id="history-plate"
              maxLength={10}
              onChange={(event) => update({ plate: event.target.value })}
              placeholder="Ex.: DEM-1A23"
              value={draft.plate}
            />
          </div>
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="history-driver"
            >
              Condutor
            </label>
            <input
              className={fieldClass}
              id="history-driver"
              maxLength={200}
              onChange={(event) => update({ driverName: event.target.value })}
              placeholder="Nome do condutor"
              value={draft.driverName}
            />
          </div>
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="history-status"
            >
              Situação
            </label>
            <select
              className={fieldClass}
              id="history-status"
              onChange={(event) => update({ status: event.target.value })}
              value={draft.status}
            >
              <option value="">Todas</option>
              <option value="Aberto">Em aberto</option>
              <option value="Encerrado">Concluídos</option>
            </select>
          </div>
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="history-category"
            >
              Categoria
            </label>
            <select
              className={fieldClass}
              id="history-category"
              onChange={(event) => update({ categoryName: event.target.value })}
              value={draft.categoryName}
            >
              <option value="">Todas</option>
              {generalAccessCategories.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 rounded-2xl border border-ink/10 bg-cream/30 p-4 sm:grid-cols-2">
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="history-from"
            >
              Data inicial
            </label>
            <input
              className={fieldClass}
              id="history-from"
              max={draft.toDate}
              onChange={(event) =>
                update({ fromDate: event.target.value, period: "custom" })
              }
              required
              type="date"
              value={draft.fromDate}
            />
          </div>
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="history-to"
            >
              Data final
            </label>
            <input
              className={fieldClass}
              id="history-to"
              min={draft.fromDate}
              onChange={(event) =>
                update({ toDate: event.target.value, period: "custom" })
              }
              required
              type="date"
              value={draft.toDate}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            className="min-h-11 rounded-xl bg-brand px-6 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-65"
            disabled={requestStatus === "loading"}
            type="submit"
          >
            {requestStatus === "loading" ? "Consultando…" : "Aplicar filtros"}
          </button>
        </div>
      </div>
    </form>
  );
}
