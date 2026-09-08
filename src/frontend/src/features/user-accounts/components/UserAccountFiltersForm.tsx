import type { UserAccountFilters } from "../types";

interface UserAccountFiltersFormProps {
  disabled: boolean;
  draft: UserAccountFilters;
  error: string | null;
  onApply: () => void;
  onChange: (filters: UserAccountFilters) => void;
  onClear: () => void;
}

const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-ink/20 bg-white px-3 text-sm text-ink outline-none focus:border-brand-dark focus:ring-3 focus:ring-brand/20 disabled:cursor-wait disabled:opacity-60";

export function UserAccountFiltersForm({
  disabled,
  draft,
  error,
  onApply,
  onChange,
  onClear,
}: UserAccountFiltersFormProps) {
  return (
    <form
      className="grid gap-4 border-b border-ink/8 p-5 sm:grid-cols-[minmax(14rem,1fr)_13rem_auto] sm:items-end sm:px-6"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div>
        <label
          className="text-sm font-semibold text-ink"
          htmlFor="account-search"
        >
          Nome ou e-mail
        </label>
        <input
          aria-describedby={error ? "account-search-error" : undefined}
          aria-invalid={Boolean(error)}
          className={fieldClass}
          disabled={disabled}
          id="account-search"
          maxLength={254}
          onChange={(event) =>
            onChange({ ...draft, page: 1, search: event.target.value })
          }
          value={draft.search}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-800" id="account-search-error">
            {error}
          </p>
        )}
      </div>
      <div>
        <label
          className="text-sm font-semibold text-ink"
          htmlFor="account-active"
        >
          Situação
        </label>
        <select
          className={fieldClass}
          disabled={disabled}
          id="account-active"
          onChange={(event) =>
            onChange({
              ...draft,
              active:
                event.target.value === ""
                  ? undefined
                  : event.target.value === "true",
              page: 1,
            })
          }
          value={draft.active === undefined ? "" : String(draft.active)}
        >
          <option value="">Todas</option>
          <option value="true">Ativas</option>
          <option value="false">Desativadas</option>
        </select>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className="min-h-11 rounded-xl border border-ink/20 px-4 text-sm font-bold text-ink hover:bg-cream disabled:cursor-wait disabled:opacity-60"
          disabled={disabled}
          onClick={onClear}
          type="button"
        >
          Limpar
        </button>
        <button
          className="min-h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
          disabled={disabled}
          type="submit"
        >
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}
