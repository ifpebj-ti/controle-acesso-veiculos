import { Icon } from "../../../components/ui/Icon";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { EventAuthorization, EventAuthorizationPage } from "../types";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function eventStatus(event: EventAuthorization) {
  if (!event.active) return { label: "Cancelado", tone: "danger" as const };
  const now = Date.now();
  if (Date.parse(event.startsAtUtc) > now)
    return { label: "Agendado", tone: "neutral" as const };
  if (Date.parse(event.endsAtUtc) >= now)
    return { label: "Em vigor", tone: "success" as const };
  return { label: "Encerrado", tone: "warning" as const };
}

interface EventAuthorizationCatalogProps {
  canManage: boolean;
  onCancel: (event: EventAuthorization) => void;
  onEdit: (event: EventAuthorization) => void;
  onPageChange: (page: number) => void;
  page: EventAuthorizationPage | null;
  pendingAction: string | null;
  status: "loading" | "ready" | "error";
}

export function EventAuthorizationCatalog({
  canManage,
  onCancel,
  onEdit,
  onPageChange,
  page,
  pendingAction,
  status,
}: EventAuthorizationCatalogProps) {
  return (
    <div aria-busy={status === "loading"}>
      {status === "ready" && page && (
        <p aria-live="polite" className="px-5 pt-5 text-sm text-ink/60 sm:px-6">
          {page.totalCount} autorização(ões) encontrada(s)
        </p>
      )}
      {status === "loading" ? (
        <div
          className="m-5 rounded-2xl bg-cream/50 p-10 text-center"
          role="status"
        >
          Carregando autorizações de eventos…
        </div>
      ) : status === "error" ? null : page?.items.length === 0 ? (
        <div className="m-5 rounded-2xl border border-dashed border-ink/20 bg-cream/40 p-10 text-center sm:m-6">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft/45">
            <Icon name="calendar" />
          </span>
          <p className="mt-4 font-bold text-ink">
            Nenhuma autorização encontrada
          </p>
          <p className="mt-1 text-sm text-ink/60">
            Revise os filtros ou cadastre uma nova autorização.
          </p>
        </div>
      ) : page ? (
        <>
          <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-2">
            {page.items.map((event) => {
              const statusInfo = eventStatus(event);
              const expected = event.vehicleRules.reduce(
                (total, rule) => total + rule.quantity,
                0,
              );
              const consumed = event.vehicleRules.reduce(
                (total, rule) => total + rule.consumedQuantity,
                0,
              );
              const remaining = event.vehicleRules.reduce(
                (total, rule) => total + rule.remainingQuantity,
                0,
              );
              return (
                <article
                  className="flex min-w-0 flex-col rounded-2xl border border-ink/10 bg-cream/25 p-5"
                  key={event.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                        {event.area}
                      </p>
                      <h3 className="mt-1 break-words text-xl font-bold text-ink">
                        {event.name}
                      </h3>
                      <p className="mt-1 text-sm text-ink/65">
                        Responsável: {event.responsible}
                      </p>
                    </div>
                    <StatusBadge
                      label={statusInfo.label}
                      tone={statusInfo.tone}
                    />
                  </div>
                  <p className="mt-4 rounded-xl bg-white/80 p-3 text-sm text-ink/75">
                    <strong>
                      {dateTimeFormatter.format(new Date(event.startsAtUtc))}
                    </strong>{" "}
                    até{" "}
                    <strong>
                      {dateTimeFormatter.format(new Date(event.endsAtUtc))}
                    </strong>
                  </p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-brand-soft/35 p-3">
                      <dt className="text-xs text-ink/60">Previstos</dt>
                      <dd className="mt-1 text-lg font-bold">{expected}</dd>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-3">
                      <dt className="text-xs text-ink/60">
                        Entradas registradas
                      </dt>
                      <dd className="mt-1 text-lg font-bold">{consumed}</dd>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3">
                      <dt className="text-xs text-ink/60">Restantes</dt>
                      <dd className="mt-1 text-lg font-bold">{remaining}</dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink/55">
                      Regras de veículos
                    </h4>
                    <ul className="mt-2 space-y-2 text-sm">
                      {event.vehicleRules.map((rule) => (
                        <li
                          className="flex flex-wrap justify-between gap-2 rounded-xl border border-ink/10 bg-white p-3"
                          key={rule.id}
                        >
                          <span className="font-semibold">
                            {rule.plate
                              ? `Placa ${rule.plate}`
                              : rule.vehicleType}
                          </span>
                          <span className="text-ink/60">
                            {rule.consumedQuantity} de {rule.quantity}{" "}
                            entrada(s)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-ink/60">
                    {event.overnightAllowed
                      ? "Pernoite permitido"
                      : "Pernoite não permitido"}
                  </p>
                  {event.notes && (
                    <p className="mt-2 text-sm leading-6 text-ink/65">
                      {event.notes}
                    </p>
                  )}
                  {canManage && event.active && (
                    <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
                      <button
                        className="min-h-11 flex-1 rounded-xl border border-ink/20 px-4 text-sm font-bold hover:bg-white disabled:opacity-60"
                        disabled={pendingAction !== null}
                        onClick={() => onEdit(event)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="min-h-11 flex-1 rounded-xl border border-red-300 px-4 text-sm font-bold text-red-800 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                        disabled={pendingAction !== null}
                        onClick={() => onCancel(event)}
                        type="button"
                      >
                        {pendingAction === `cancel-${event.id}`
                          ? "Cancelando…"
                          : "Cancelar autorização"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {page.totalPages > 1 && (
            <nav
              aria-label="Paginação de autorizações"
              className="flex items-center justify-center gap-3 border-t border-ink/10 p-5"
            >
              <button
                className="min-h-10 rounded-xl border border-ink/20 px-4 text-sm font-bold disabled:opacity-45"
                disabled={page.page <= 1 || pendingAction !== null}
                onClick={() => onPageChange(page.page - 1)}
                type="button"
              >
                Anterior
              </button>
              <span className="text-sm text-ink/65">
                Página {page.page} de {page.totalPages}
              </span>
              <button
                className="min-h-10 rounded-xl border border-ink/20 px-4 text-sm font-bold disabled:opacity-45"
                disabled={
                  page.page >= page.totalPages || pendingAction !== null
                }
                onClick={() => onPageChange(page.page + 1)}
                type="button"
              >
                Próxima
              </button>
            </nav>
          )}
        </>
      ) : null}
    </div>
  );
}
