import { auditActions, type AuditTrailFilters } from "../types";
import type { AuditTrailFilterErrors } from "../types";

const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-ink/20 bg-white px-3 text-sm text-ink outline-none focus:border-brand-dark focus:ring-3 focus:ring-brand/20 disabled:opacity-60";

const actionLabels = {
  Alteracao: "Alteração",
  Consulta: "Consulta",
  Exclusao: "Exclusão",
  Inclusao: "Inclusão",
  Login: "Login",
  Logout: "Logout",
} as const;

function optionalPositiveInteger(value: string) {
  return value === "" ? undefined : Number(value);
}

function describedBy(...ids: Array<string | false | undefined>) {
  return ids.filter(Boolean).join(" ") || undefined;
}

interface AuditTrailFiltersProps {
  disabled: boolean;
  draft: AuditTrailFilters;
  errors: AuditTrailFilterErrors;
  onApply: () => void;
  onChange: (next: AuditTrailFilters) => void;
  onClear: () => void;
}

export function AuditTrailFilters({
  disabled,
  draft,
  errors,
  onApply,
  onChange,
  onClear,
}: AuditTrailFiltersProps) {
  const periodDescription = describedBy(
    "audit-period-hint",
    errors.period && "audit-period-error",
  );
  const actorDescription = describedBy(errors.actor && "audit-actor-error");

  return (
    <form
      className="mt-5 grid gap-4 border-y border-ink/10 bg-brand-soft/20 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div>
        <label className="text-sm font-semibold" htmlFor="audit-from">
          Início do período
        </label>
        <input
          aria-describedby={periodDescription}
          aria-invalid={Boolean(errors.period)}
          className={fieldClass}
          disabled={disabled}
          id="audit-from"
          onChange={(event) =>
            onChange({ ...draft, fromUtc: event.target.value })
          }
          type="datetime-local"
          value={draft.fromUtc}
        />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="audit-to">
          Fim do período
        </label>
        <input
          aria-describedby={periodDescription}
          aria-invalid={Boolean(errors.period)}
          className={fieldClass}
          disabled={disabled}
          id="audit-to"
          onChange={(event) =>
            onChange({ ...draft, toUtc: event.target.value })
          }
          type="datetime-local"
          value={draft.toUtc}
        />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="audit-action">
          Ação
        </label>
        <select
          aria-describedby={errors.action ? "audit-action-error" : undefined}
          aria-invalid={Boolean(errors.action)}
          className={fieldClass}
          disabled={disabled}
          id="audit-action"
          onChange={(event) =>
            onChange({
              ...draft,
              action: event.target.value as AuditTrailFilters["action"],
            })
          }
          value={draft.action}
        >
          <option value="">Todas</option>
          {auditActions.map((action) => (
            <option key={action} value={action}>
              {actionLabels[action]}
            </option>
          ))}
        </select>
        {errors.action && (
          <FieldError id="audit-action-error" message={errors.action} />
        )}
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="audit-entity">
          Entidade
        </label>
        <input
          aria-describedby={errors.entity ? "audit-entity-error" : undefined}
          aria-invalid={Boolean(errors.entity)}
          className={fieldClass}
          disabled={disabled}
          id="audit-entity"
          maxLength={100}
          onChange={(event) =>
            onChange({ ...draft, entity: event.target.value })
          }
          placeholder="Ex.: Usuario"
          value={draft.entity}
        />
        {errors.entity && (
          <FieldError id="audit-entity-error" message={errors.entity} />
        )}
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="audit-record-id">
          ID do registro
        </label>
        <input
          aria-describedby={
            errors.recordId ? "audit-record-id-error" : undefined
          }
          aria-invalid={Boolean(errors.recordId)}
          className={fieldClass}
          disabled={disabled}
          id="audit-record-id"
          min="1"
          onChange={(event) =>
            onChange({
              ...draft,
              recordId: optionalPositiveInteger(event.target.value),
            })
          }
          type="number"
          value={draft.recordId ?? ""}
        />
        {errors.recordId && (
          <FieldError id="audit-record-id-error" message={errors.recordId} />
        )}
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="audit-actor-type">
          Origem
        </label>
        <select
          aria-describedby={actorDescription}
          aria-invalid={Boolean(errors.actor)}
          className={fieldClass}
          disabled={disabled}
          id="audit-actor-type"
          onChange={(event) =>
            onChange({
              ...draft,
              systemOnly:
                event.target.value === ""
                  ? undefined
                  : event.target.value === "system",
            })
          }
          value={
            draft.systemOnly === undefined
              ? ""
              : draft.systemOnly
                ? "system"
                : "human"
          }
        >
          <option value="">Todas</option>
          <option value="human">Pessoa usuária</option>
          <option value="system">Sistema</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="audit-actor-id">
          ID do usuário
        </label>
        <input
          aria-describedby={describedBy(
            errors.actorUserId && "audit-actor-id-error",
            actorDescription,
          )}
          aria-invalid={Boolean(errors.actorUserId || errors.actor)}
          className={fieldClass}
          disabled={disabled}
          id="audit-actor-id"
          min="1"
          onChange={(event) =>
            onChange({
              ...draft,
              actorUserId: optionalPositiveInteger(event.target.value),
            })
          }
          type="number"
          value={draft.actorUserId ?? ""}
        />
        {errors.actorUserId && (
          <FieldError id="audit-actor-id-error" message={errors.actorUserId} />
        )}
      </div>
      <div className="flex items-end gap-2">
        <button
          className="min-h-11 flex-1 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-60"
          disabled={disabled}
          type="submit"
        >
          Aplicar filtros
        </button>
        <button
          className="min-h-11 rounded-xl border border-ink/20 px-4 text-sm font-bold disabled:opacity-60"
          disabled={disabled}
          onClick={onClear}
          type="button"
        >
          Limpar
        </button>
      </div>
      <p
        className="text-xs text-ink/60 sm:col-span-2 xl:col-span-4"
        id="audit-period-hint"
      >
        A consulta inicia com os últimos 30 dias e aceita intervalos de até 90
        dias.
      </p>
      {errors.period && (
        <FieldError id="audit-period-error" message={errors.period} wide />
      )}
      {errors.actor && (
        <FieldError id="audit-actor-error" message={errors.actor} wide />
      )}
      {(errors.page || errors.pageSize) && (
        <FieldError
          id="audit-pagination-error"
          message={errors.page ?? errors.pageSize ?? "A paginação é inválida."}
          wide
        />
      )}
    </form>
  );
}

function FieldError({
  id,
  message,
  wide = false,
}: {
  id: string;
  message: string;
  wide?: boolean;
}) {
  return (
    <p
      className={`mt-1.5 text-sm font-semibold text-red-800 ${wide ? "sm:col-span-2 xl:col-span-4" : ""}`}
      id={id}
      role="alert"
    >
      {message}
    </p>
  );
}
