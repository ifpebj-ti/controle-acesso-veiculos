import { type FormEvent, type ReactNode, useId } from "react";

import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import {
  fleetStatusOptions,
  movementStatusOptions,
} from "../model/reportPresentation";
import type {
  AdministrativeReportFilters,
  AdministrativeReportKind,
} from "../types";

interface ReportFiltersProps {
  draft: AdministrativeReportFilters;
  kind: AdministrativeReportKind;
  onChange: (filters: AdministrativeReportFilters) => void;
  onClear: () => void;
  onSubmit: () => void;
  validationMessage: string | null;
}

export function ReportFilters({
  draft,
  kind,
  onChange,
  onClear,
  onSubmit,
  validationMessage,
}: ReportFiltersProps) {
  const errorId = useId();
  const update = (field: keyof AdministrativeReportFilters, value: string) =>
    onChange({ ...draft, [field]: value });

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      aria-labelledby="report-filters-title"
      className="event-filter-panel mt-5 grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4"
      onSubmit={submit}
    >
      <div className="event-filter-panel__heading flex items-start gap-3 sm:col-span-2 xl:col-span-4">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-surface text-primary"
        >
          <Icon name="search" size={20} />
        </span>
        <div>
          <h2 className="font-bold text-ink" id="report-filters-title">
            Encontrar registros
          </h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Consulte por período, veículo, condutor e situação.
          </p>
        </div>
      </div>

      <FilterField label="Data inicial">
        <TextField
          aria-describedby={validationMessage ? errorId : undefined}
          aria-invalid={Boolean(validationMessage)}
          className="font-normal"
          max={draft.to}
          onChange={(event) => update("from", event.target.value)}
          required
          type="date"
          value={draft.from}
        />
      </FilterField>
      <FilterField label="Data final">
        <TextField
          aria-describedby={validationMessage ? errorId : undefined}
          aria-invalid={Boolean(validationMessage)}
          className="font-normal"
          min={draft.from}
          onChange={(event) => update("to", event.target.value)}
          required
          type="date"
          value={draft.to}
        />
      </FilterField>
      <FilterField label="Placa">
        <TextField
          className="font-normal"
          onChange={(event) => update("plate", event.target.value)}
          placeholder="Busca parcial"
          value={draft.plate}
        />
      </FilterField>
      <FilterField label="Condutor">
        <TextField
          className="font-normal"
          onChange={(event) => update("driverName", event.target.value)}
          placeholder="Nome do condutor"
          value={draft.driverName}
        />
      </FilterField>
      {kind === "movements" ? (
        <FilterField label="Categoria">
          <TextField
            className="font-normal"
            onChange={(event) => update("categoryName", event.target.value)}
            placeholder="Busca parcial"
            value={draft.categoryName}
          />
        </FilterField>
      ) : (
        <FilterField label="Identificação interna">
          <TextField
            className="font-normal"
            onChange={(event) =>
              update("vehicleIdentification", event.target.value)
            }
            placeholder="Não é uma placa"
            value={draft.vehicleIdentification}
          />
        </FilterField>
      )}
      <FilterField label="Situação">
        <SelectField
          className="font-normal"
          id="report-status"
          onValueChange={(value) => update("status", value)}
          options={
            kind === "movements"
              ? movementStatusOptions.map((option) => ({ ...option }))
              : fleetStatusOptions.map((option) => ({ ...option }))
          }
          value={draft.status}
        />
      </FilterField>

      {validationMessage && (
        <p
          className="rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm font-semibold text-danger-text sm:col-span-2 xl:col-span-4"
          id={errorId}
          role="alert"
        >
          {validationMessage}
        </p>
      )}
      <p className="text-xs leading-5 text-ink-soft sm:col-span-2 xl:col-span-4">
        O período considera todos os horários das datas selecionadas e pode ter
        no máximo 31 dias.
      </p>
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2 xl:col-span-4">
        <Button onClick={onClear} type="button" variant="secondary">
          Limpar filtros
        </Button>
        <Button type="submit">
          <Icon name="search" size={18} /> Aplicar filtros
        </Button>
      </div>
    </form>
  );
}

function FilterField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-normal text-text">
      <span className="font-bold">{label}</span>
      {children}
    </label>
  );
}
