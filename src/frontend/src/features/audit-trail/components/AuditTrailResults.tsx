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
      <p
        className="p-8 text-center text-sm font-semibold text-ink/60"
        role="status"
      >
        Carregando eventos de auditoria…
      </p>
    );
  }
  if (status !== "ready" || !page) return null;

  return (
    <>
      <p aria-live="polite" className="px-5 pt-5 text-sm text-ink/60 sm:px-6">
        {page.totalCount} evento(s) encontrado(s)
      </p>
      {page.items.length === 0 ? (
        <div className="m-5 rounded-2xl border border-dashed border-ink/20 bg-cream/40 p-10 text-center sm:m-6">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft/45">
            <Icon name="history" />
          </span>
          <h3 className="mt-4 font-display text-2xl text-ink">
            Nenhum evento encontrado
          </h3>
          <p className="mt-2 text-sm text-ink/60">
            Ajuste os filtros ou consulte outro período.
          </p>
        </div>
      ) : (
        <ol className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
          {page.items.map((entry) => (
            <li key={entry.id}>
              <AuditEntryCard entry={entry} />
            </li>
          ))}
        </ol>
      )}
      {page.totalPages > 1 && (
        <nav
          aria-label="Paginação da auditoria"
          className="flex items-center justify-between gap-4 border-t border-ink/10 px-5 py-4 sm:px-6"
        >
          <button
            className="min-h-10 rounded-xl border border-ink/20 px-4 text-sm font-bold disabled:opacity-40"
            disabled={page.page <= 1}
            onClick={() => onPageChange(page.page - 1)}
            type="button"
          >
            Anterior
          </button>
          <span className="text-sm font-semibold">
            Página {page.page} de {page.totalPages}
          </span>
          <button
            className="min-h-10 rounded-xl border border-ink/20 px-4 text-sm font-bold disabled:opacity-40"
            disabled={page.page >= page.totalPages}
            onClick={() => onPageChange(page.page + 1)}
            type="button"
          >
            Próxima
          </button>
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
    <article className="h-full rounded-2xl border border-ink/10 bg-cream/25 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-dark">
            {entry.entity} · registro #{entry.recordId}
          </p>
          <h3 className="mt-1 text-lg font-bold text-ink">
            {actionLabels[entry.action]}
          </h3>
        </div>
        <time
          className="text-xs font-semibold text-ink/60"
          dateTime={entry.occurredAtUtc}
        >
          {dateTimeFormatter.format(new Date(entry.occurredAtUtc))}
        </time>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink/55">Origem</dt>
          <dd className="font-semibold">{actor}</dd>
        </div>
        <div>
          <dt className="text-ink/55">Evento</dt>
          <dd>#{entry.id}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-ink/55">Detalhes</dt>
          <dd className="break-words">{entry.details ?? "Não informado"}</dd>
        </div>
      </dl>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
    <details className="rounded-xl border border-ink/10 bg-white p-3">
      <summary className="cursor-pointer text-sm font-bold">{label}</summary>
      {value === null ? (
        <p className="mt-3 text-sm text-ink/60">Não informado</p>
      ) : (
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-ink p-3 text-xs text-white">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </details>
  );
}
