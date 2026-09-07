import type { EventAuthorizationFilters as Filters } from "../types";

interface EventAuthorizationFilterFormProps {
  disabled: boolean;
  draft: Filters;
  onApply: () => void;
  onChange: (next: Filters) => void;
  onClear: () => void;
}

const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-ink/20 bg-white px-3 text-sm text-ink outline-none focus:border-brand-dark focus:ring-3 focus:ring-brand/20 disabled:opacity-60";

export function EventAuthorizationFilterForm({
  disabled,
  draft,
  onApply,
  onChange,
  onClear,
}: EventAuthorizationFilterFormProps) {
  return (
    <form
      className="grid gap-4 border-b border-ink/10 bg-brand-soft/20 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-[1.2fr_1fr_1fr_.7fr_auto] xl:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div>
        <label
          className="text-sm font-semibold text-ink"
          htmlFor="event-filter-name"
        >
          Buscar pelo nome do evento
        </label>
        <input
          className={fieldClass}
          disabled={disabled}
          id="event-filter-name"
          maxLength={200}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="Buscar por nome"
          type="search"
          value={draft.name}
        />
      </div>
      <div>
        <label
          className="text-sm font-semibold text-ink"
          htmlFor="event-filter-from"
        >
          Início do período
        </label>
        <input
          aria-describedby="event-filter-period-hint"
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
          aria-describedby="event-filter-period-hint"
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
        <select
          className={fieldClass}
          disabled={disabled}
          id="event-filter-active"
          onChange={(event) =>
            onChange({
              ...draft,
              active: event.target.value as Filters["active"],
            })
          }
          value={draft.active}
        >
          <option value="true">Ativos</option>
          <option value="false">Cancelados</option>
          <option value="all">Todos</option>
        </select>
      </div>
      <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
        <button
          className="min-h-11 flex-1 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
          disabled={disabled}
          type="submit"
        >
          Aplicar
        </button>
        <button
          className="min-h-11 rounded-xl border border-ink/20 px-4 text-sm font-bold text-ink disabled:opacity-60"
          disabled={disabled}
          onClick={onClear}
          type="button"
        >
          Limpar
        </button>
      </div>
      <p
        className="text-xs text-ink/60 sm:col-span-2 xl:col-span-5"
        id="event-filter-period-hint"
      >
        O período considera data e hora locais e pode abranger no máximo 366
        dias.
      </p>
    </form>
  );
}
