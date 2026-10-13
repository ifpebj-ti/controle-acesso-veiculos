import type { FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
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

    if (requestStatus === "loading") return;

    onApply();
  }

  function update(values: Partial<AccessHistoryFilterDraft>) {
    onDraftChange({ ...draft, ...values });
  }

  return (
    <form onSubmit={submit}>
      <div className="border-b border-border bg-surface-subtle px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Filtros da consulta
            </p>
            <h2 className="mt-2 text-2xl font-bold text-text">
              Encontre um registro
            </h2>
          </div>
          <Button onClick={onClear} type="button" variant="secondary">
            Limpar filtros
          </Button>
        </div>

        <fieldset className="mt-5">
          <legend className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
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
              <Button
                aria-pressed={draft.period === value}
                className="rounded-full text-xs"
                key={value}
                onClick={() => onPeriodChange(value as PeriodPreset)}
                type="button"
                variant={draft.period === value ? "primary" : "secondary"}
              >
                {label}
              </Button>
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
            <TextField
              className="mt-2 text-sm"
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
            <TextField
              className="mt-2 text-sm"
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
            <SelectField
              className="mt-2 text-sm"
              id="history-status"
              onValueChange={(value) => update({ status: value })}
              options={[
                { label: "Todas", value: "" },
                { label: "Em aberto", value: "Aberto" },
                { label: "Concluídos", value: "Encerrado" },
              ]}
              value={draft.status}
            />
          </div>
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="history-category"
            >
              Categoria
            </label>
            <SelectField
              className="mt-2 text-sm"
              id="history-category"
              onValueChange={(value) => update({ categoryName: value })}
              options={[
                { label: "Todas", value: "" },
                ...generalAccessCategories.map((option) => ({
                  label: option,
                  value: option,
                })),
              ]}
              value={draft.categoryName}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 rounded-xl border border-border bg-surface-subtle p-4 sm:grid-cols-2">
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="history-from"
            >
              Data inicial
            </label>
            <TextField
              className="mt-2 text-sm"
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
            <TextField
              className="mt-2 text-sm"
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
          <Button aria-disabled={requestStatus === "loading"} type="submit">
            {requestStatus === "loading" ? "Consultando…" : "Aplicar filtros"}
          </Button>
        </div>
      </div>
    </form>
  );
}
