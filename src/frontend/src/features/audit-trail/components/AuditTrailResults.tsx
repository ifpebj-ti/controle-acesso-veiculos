import { ContentState } from "../../../components/ui/ContentState";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import type { AuditEntry, AuditTrailPage, JsonValue } from "../types";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
});

const actionLabels = {
  Alteracao: "Alteração",
  Consulta: "Consulta",
  Exclusao: "Exclusão",
  Inclusao: "Inclusão",
  Login: "Login",
  Logout: "Logout",
} as const;

interface AuditTrailResultsProps {
  onPageChange: (page: number) => void;
  page: AuditTrailPage | null;
  status: "idle" | "loading" | "ready" | "error" | "denied";
}

export function AuditTrailResults({
  onPageChange,
  page,
  status,
}: AuditTrailResultsProps) {
  if (status === "loading") {
    return (
      <ContentState
        className="m-5 sm:m-6"
        title="Carregando eventos de auditoria…"
        variant="loading"
      />
    );
  }
  if (status !== "ready" || !page) return null;

  return (
    <>
      {page.items.length === 0 ? (
        <ContentState
          className="m-5 sm:m-6"
          description="Ajuste os filtros ou consulte outro período."
          icon="history"
          title="Nenhum evento encontrado"
          variant="empty"
        />
      ) : (
        <ol className="audit-results-list grid gap-3 p-4 sm:p-5">
          {page.items.map((entry) => (
            <li key={entry.id}>
              <AuditEntryCard entry={entry} />
            </li>
          ))}
        </ol>
      )}
      <div className="institutional-catalog__footer flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
        <p
          aria-live="polite"
          className="flex items-center gap-2 font-bold text-ink"
        >
          <Icon className="text-primary" name="clipboard" size={19} />
          {page.totalCount} evento(s) encontrado(s)
        </p>
        <p className="text-xs font-semibold text-ink-soft">
          Página {page.page} de {Math.max(page.totalPages, 1)}
        </p>
      </div>
      {page.totalPages > 1 && (
        <nav
          aria-label="Paginação da auditoria"
          className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 sm:px-6"
        >
          <Button
            disabled={page.page <= 1}
            onClick={() => onPageChange(page.page - 1)}
            variant="secondary"
          >
            Anterior
          </Button>
          <Button
            disabled={page.page >= page.totalPages}
            onClick={() => onPageChange(page.page + 1)}
            variant="secondary"
          >
            Próxima
          </Button>
        </nav>
      )}
    </>
  );
}

function AuditEntryCard({ entry }: { entry: AuditEntry }) {
  const actor =
    entry.actorType === "System"
      ? "Sistema"
      : entry.actorUserId === null
        ? "Pessoa usuária — ID não informado"
        : `Usuário #${entry.actorUserId}`;
  return (
    <article
      className="audit-entry-card grid min-w-0 gap-4 rounded-2xl border border-border bg-surface p-4 xl:grid-cols-[minmax(12rem,1.1fr)_minmax(11rem,.8fr)_minmax(14rem,1.1fr)_minmax(18rem,1.5fr)] xl:items-center"
      data-audit-action={entry.action.toLocaleLowerCase("pt-BR")}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="audit-entry-card__icon grid size-11 shrink-0 place-items-center rounded-xl bg-success-surface text-primary">
          <Icon
            name={entry.action === "Logout" ? "log-out" : "user"}
            size={22}
          />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-dark">
            {entry.entity} · registro #{entry.recordId}
          </p>
          <h3 className="mt-1 text-lg font-bold text-ink">
            {actionLabels[entry.action]}
          </h3>
        </div>
      </div>
      <div className="border-border xl:border-l xl:pl-4">
        <time
          className="flex items-center gap-2 text-sm font-semibold text-ink-soft"
          dateTime={entry.occurredAtUtc}
        >
          <Icon name="calendar" size={16} />
          {dateTimeFormatter.format(new Date(entry.occurredAtUtc))}
        </time>
        <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
          <Icon name="user" size={16} />
          <span>{actor}</span>
        </p>
      </div>
      <dl className="grid gap-2 border-border text-sm xl:border-l xl:pl-4">
        <div>
          <dt className="text-ink-soft">Evento</dt>
          <dd className="font-semibold">#{entry.id}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Detalhes</dt>
          <dd className="break-words">{entry.details ?? "Não informado"}</dd>
        </div>
      </dl>
      <div className="grid gap-2 border-border sm:grid-cols-2 xl:border-l xl:pl-4">
        <StateDetails label="Estado anterior" value={entry.previousState} />
        <StateDetails label="Novo estado" value={entry.newState} />
      </div>
    </article>
  );
}

function StateDetails({
  label,
  value,
}: {
  label: string;
  value: JsonValue | null;
}) {
  return (
    <details className="rounded-xl border border-border bg-surface p-3">
      <summary className="cursor-pointer text-sm font-bold text-primary">
        {label}
      </summary>
      {value === null ? (
        <p className="mt-3 text-sm text-ink-soft">Não informado</p>
      ) : (
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-ink p-3 text-xs text-white">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </details>
  );
}
