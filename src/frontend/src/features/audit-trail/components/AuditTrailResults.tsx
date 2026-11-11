import { ContentState } from "../../../components/ui/ContentState";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import type { AuditEntry, AuditTrailPage } from "../types";
import {
  auditActionLabels,
  auditEntityLabel,
  auditSummary,
} from "../model/auditPresentation";
import { AuditStateDetails } from "./AuditStateDetails";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
});

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
      aria-labelledby={`audit-entry-${entry.id}`}
      className="audit-entry-card grid min-w-0 gap-4 rounded-2xl border border-border bg-surface p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]"
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
            {auditEntityLabel(entry.entity)} · registro #{entry.recordId}
          </p>
          <h3
            className="mt-1 text-lg font-bold text-ink"
            id={`audit-entry-${entry.id}`}
          >
            {auditActionLabels[entry.action]}
          </h3>
        </div>
      </div>
      <div className="min-w-0 border-border xl:border-l xl:pl-4">
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
      <div className="min-w-0 border-border md:col-span-2 xl:col-span-1 xl:border-l xl:pl-4">
        <dl className="grid min-w-0 gap-2 text-sm">
          <div>
            <dt className="text-ink-soft">Evento</dt>
            <dd className="font-semibold">#{entry.id}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Resumo</dt>
            <dd>{auditSummary(entry)}</dd>
          </div>
        </dl>
        <details className="audit-entry-card__disclosure mt-3 rounded-xl border border-border p-3">
          <summary className="cursor-pointer text-sm font-semibold text-primary">
            Detalhes técnicos originais
          </summary>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="font-semibold">Entidade original</dt>
              <dd>{entry.entity}</dd>
            </div>
            <div>
              <dt className="font-semibold">Descrição original</dt>
              <dd className="whitespace-pre-wrap">
                {entry.details ?? "Não informado"}
              </dd>
            </div>
          </dl>
        </details>
      </div>
      <div className="grid min-w-0 gap-3 border-t border-border pt-4 sm:grid-cols-2 md:col-span-2 xl:col-span-3">
        <AuditStateDetails
          entity={entry.entity}
          label="Estado anterior"
          value={entry.previousState}
        />
        <AuditStateDetails
          entity={entry.entity}
          label="Novo estado"
          value={entry.newState}
        />
      </div>
    </article>
  );
}
