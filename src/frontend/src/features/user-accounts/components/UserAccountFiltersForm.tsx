import { SelectField } from "../../../components/ui/SelectField";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
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
  "mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-wait disabled:opacity-60";

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
      className="account-filter-panel mt-4 grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[minmax(14rem,1fr)_13rem_auto] sm:items-end sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className="account-filter-panel__heading flex items-start gap-3 sm:col-span-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-surface text-primary"
        >
          <Icon name="search" size={20} />
        </span>
        <div>
          <h2 className="font-bold text-ink">Encontrar uma conta</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Consulte por nome, e-mail ou situação de acesso.
          </p>
        </div>
      </div>
      <div>
        <label
          className="text-sm font-semibold text-ink"
          htmlFor="account-search"
        >
          Nome ou e-mail
        </label>
        <div className="relative">
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 mt-1 -translate-y-1/2 text-primary"
            name="search"
            size={18}
          />
          <input
            aria-describedby={error ? "account-search-error" : undefined}
            aria-invalid={Boolean(error)}
            className={`${fieldClass} pl-10`}
            disabled={disabled}
            id="account-search"
            maxLength={254}
            onChange={(event) =>
              onChange({ ...draft, page: 1, search: event.target.value })
            }
            placeholder="Digite o nome ou e-mail"
            value={draft.search}
          />
        </div>
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
        <SelectField
          className={fieldClass}
          disabled={disabled}
          id="account-active"
          onValueChange={(value) =>
            onChange({
              ...draft,
              active: value === "" ? undefined : value === "true",
              page: 1,
            })
          }
          options={[
            { label: "Todas", value: "" },
            { label: "Ativas", value: "true" },
            { label: "Desativadas", value: "false" },
          ]}
          value={draft.active === undefined ? "" : String(draft.active)}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button disabled={disabled} onClick={onClear} variant="secondary">
          Limpar
        </Button>
        <Button disabled={disabled} type="submit">
          Aplicar filtros
        </Button>
      </div>
    </form>
  );
}
