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
  onSubmit: () => void;
  validationMessage: string | null;
}

export function ReportFilters({
  draft,
  kind,
  onChange,
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
      className="mt-5 rounded-2xl border border-border bg-surface p-4 sm:p-6"
      onSubmit={submit}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Data inicial">
          <TextField
            aria-describedby={validationMessage ? errorId : undefined}
            aria-invalid={Boolean(validationMessage)}
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
            min={draft.from}
            onChange={(event) => update("to", event.target.value)}
            required
            type="date"
            value={draft.to}
          />
        </FilterField>
        <FilterField label="Placa">
          <TextField
            onChange={(event) => update("plate", event.target.value)}
            placeholder="Busca parcial"
            value={draft.plate}
          />
        </FilterField>
        <FilterField label="Condutor">
          <TextField
            onChange={(event) => update("driverName", event.target.value)}
            placeholder="Nome do condutor"
            value={draft.driverName}
          />
        </FilterField>
        {kind === "movements" ? (
          <FilterField label="Categoria">
            <TextField
              onChange={(event) => update("categoryName", event.target.value)}
              placeholder="Busca parcial"
              value={draft.categoryName}
            />
          </FilterField>
        ) : (
          <FilterField label="Identificação interna">
            <TextField
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
      </div>
      {validationMessage && (
        <p
          className="mt-3 text-sm font-semibold text-danger-text"
          id={errorId}
          role="alert"
        >
          {validationMessage}
        </p>
      )}
      <div className="mt-5 flex justify-end">
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
    <label className="grid min-w-0 gap-2 text-sm font-bold text-text">
      {label}
      {children}
    </label>
  );
}
