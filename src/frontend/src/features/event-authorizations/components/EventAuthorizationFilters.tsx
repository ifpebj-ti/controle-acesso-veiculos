import { SelectField } from "../../../components/ui/SelectField";
import { Icon } from "../../../components/ui/Icon";
import { Button } from "../../../components/ui/Button";
import type { EventAuthorizationFilters as Filters } from "../types";

interface EventAuthorizationFilterFormProps {
  disabled: boolean;
  draft: Filters;
  periodError: string | null;
  onApply: () => void;
  onChange: (next: Filters) => void;
  onClear: () => void;
}

const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:opacity-60";

export function EventAuthorizationFilterForm({
  disabled,
  draft,
  periodError,
  onApply,
  onChange,
  onClear,
}: EventAuthorizationFilterFormProps) {
  const periodDescription = periodError
    ? "event-filter-period-hint event-filter-period-error"
    : "event-filter-period-hint";

  return (
    <form
      className="event-filter-panel mt-4 grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[1.2fr_1fr_1fr_.7fr_auto] xl:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className="event-filter-panel__heading flex items-start gap-3 sm:col-span-2 xl:col-span-5">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-surface text-primary"
        >
          <Icon name="search" size={20} />
        </span>
        <div>
          <h2 className="font-bold text-ink">Encontrar uma autorização</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Consulte por nome, período e situação do evento.
          </p>
        </div>
      </div>
      <div>
        <label
          className="text-sm font-semibold text-ink"
          htmlFor="event-filter-name"
        >
          Buscar pelo nome do evento
        </label>
        <div className="relative">
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 mt-1 -translate-y-1/2 text-primary"
            name="search"
            size={18}
          />
          <input
            className={`${fieldClass} pl-10`}
            disabled={disabled}
            id="event-filter-name"
            maxLength={200}
            onChange={(event) =>
              onChange({ ...draft, name: event.target.value })
            }
            placeholder="Nome do evento"
            type="search"
            value={draft.name}
          />
        </div>
      </div>
      <div>
        <label
          className="text-sm font-semibold text-ink"
          htmlFor="event-filter-from"
        >
          Início do período
        </label>
        <input
          aria-describedby={periodDescription}
          aria-invalid={Boolean(periodError)}
          className={fieldClass}
          disabled={disabled}
          id="event-filter-from"
          onChange={(event) =>
            onChange({ ...draft, fromUtc: event.target.value })
          }
          type="datetime-local"
          value={draft.fromUtc}
        />
      </div>
      <div>
        <label
          className="text-sm font-semibold text-ink"
          htmlFor="event-filter-to"
        >
          Fim do período
        </label>
        <input
          aria-describedby={periodDescription}
          aria-invalid={Boolean(periodError)}
          className={fieldClass}
          disabled={disabled}
          id="event-filter-to"
          onChange={(event) =>
            onChange({ ...draft, toUtc: event.target.value })
          }
          type="datetime-local"
          value={draft.toUtc}
        />
      </div>
      <div>
        <label
          className="text-sm font-semibold text-ink"
          htmlFor="event-filter-active"
        >
          Situação
        </label>
        <SelectField
          className={fieldClass}
          disabled={disabled}
          id="event-filter-active"
          onValueChange={(value) =>
            onChange({
              ...draft,
              active: value as Filters["active"],
            })
          }
          options={[
            { label: "Ativos", value: "true" },
            { label: "Cancelados", value: "false" },
            { label: "Todos", value: "all" },
          ]}
          value={draft.active}
        />
      </div>
      <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
        <Button className="flex-1" disabled={disabled} type="submit">
          Aplicar filtros
        </Button>
        <Button disabled={disabled} onClick={onClear} variant="secondary">
          Limpar
        </Button>
      </div>
      <p
        className="text-xs text-ink-soft sm:col-span-2 xl:col-span-5"
        id="event-filter-period-hint"
      >
        O período considera data e hora locais e pode abranger no máximo 366
        dias.
      </p>
      {periodError && (
        <p
          className="text-sm font-semibold text-red-800 sm:col-span-2 xl:col-span-5"
          id="event-filter-period-error"
          role="alert"
        >
          {periodError}
        </p>
      )}
    </form>
  );
}
