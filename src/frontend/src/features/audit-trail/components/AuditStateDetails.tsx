import { auditStateFields } from "../model/auditPresentation";
import type { JsonValue } from "../types";

export function AuditStateDetails({
  entity,
  label,
  value,
}: {
  entity: string;
  label: string;
  value: JsonValue | null;
}) {
  const fields = auditStateFields(entity, value);
  return (
    <details className="audit-entry-card__disclosure rounded-xl border border-border bg-surface p-3">
      <summary className="cursor-pointer text-sm font-bold text-primary">
        {label}
      </summary>
      {value === null ? (
        <p className="mt-3 text-sm text-ink-soft">Não informado</p>
      ) : (
        <>
          {fields.length > 0 ? (
            <dl className="mt-3 grid gap-3 text-sm">
              {fields.map((field) => (
                <div className="min-w-0" key={field.key}>
                  <dt className="font-semibold text-ink">{field.label}</dt>
                  <dd className="mt-1 text-ink-soft">{field.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              Conteúdo disponível nos dados originais.
            </p>
          )}
          <details className="audit-entry-card__disclosure mt-3 rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-sm font-semibold text-primary">
              Dados originais — {label.toLocaleLowerCase("pt-BR")}
            </summary>
            <pre
              aria-label={`Dados originais — ${label.toLocaleLowerCase("pt-BR")}`}
              className="audit-entry-card__raw mt-3 rounded-lg bg-surface-subtle p-3 text-xs text-ink"
              tabIndex={0}
            >
              {JSON.stringify(value, null, 2)}
            </pre>
          </details>
        </>
      )}
    </details>
  );
}
