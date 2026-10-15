import { ContentState } from "../../../components/ui/ContentState";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { eventParkingLocationLabel } from "../model/parkingLocations";
import type { EventAuthorization, EventAuthorizationPage } from "../types";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function eventStatus(event: EventAuthorization) {
  if (!event.active)
    return {
      key: "cancelled",
      label: "Cancelado",
      tone: "danger" as const,
    };
  const now = Date.now();
  if (Date.parse(event.startsAtUtc) > now)
    return {
      key: "scheduled",
      label: "Agendado",
      tone: "neutral" as const,
    };
  if (Date.parse(event.endsAtUtc) >= now)
    return {
      key: "active",
      label: "Em vigor",
      tone: "success" as const,
    };
  return { key: "ended", label: "Encerrado", tone: "warning" as const };
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
      {status === "loading" ? (
        <ContentState
          className="m-5 sm:m-6"
          title="Carregando autorizações de eventos…"
          variant="loading"
        />
      ) : status === "error" ? null : page && page.items.length === 0 ? (
        <>
          <ContentState
            className="m-5 sm:m-6"
            description="Revise os filtros ou cadastre uma nova autorização."
            icon="calendar"
            title="Nenhuma autorização encontrada"
            variant="empty"
          />
          <EventCatalogFooter page={page} />
        </>
      ) : page ? (
        <>
          <div className="event-catalog-grid grid gap-4 p-5 sm:grid-cols-2 sm:p-6 2xl:grid-cols-3">
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
                  className="event-authorization-card flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-4"
                  data-event-status={statusInfo.key}
                  key={event.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="event-authorization-card__icon grid size-11 shrink-0 place-items-center rounded-xl bg-success-surface text-primary">
                      <Icon name="calendar" size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="break-words text-base font-bold text-ink">
                          {event.name}
                        </h3>
                        <StatusBadge
                          label={statusInfo.label}
                          tone={statusInfo.tone}
                        />
                      </div>
                      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink-soft">
                        <Icon name="calendar" size={14} />
                        <span>
                          {dateTimeFormatter.format(
                            new Date(event.startsAtUtc),
                          )}{" "}
                          até{" "}
                          {dateTimeFormatter.format(new Date(event.endsAtUtc))}
                        </span>
                      </p>
                      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-ink-soft">
                        <Icon name="dashboard" size={14} />
                        <span className="break-words">{event.area}</span>
                      </p>
                      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-ink-soft">
                        <Icon name="user" size={14} />
                        <span className="break-words">{event.responsible}</span>
                      </p>
                      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-ink-soft">
                        <Icon name="mail" size={14} />
                        <span className="break-all">
                          {event.responsibleContact ?? "Contato não informado"}
                        </span>
                      </p>
                      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-ink-soft">
                        <Icon name="car" size={14} />
                        <span>
                          Estacionamento:{" "}
                          {eventParkingLocationLabel(event.parkingLocation)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <dl className="event-authorization-card__metrics mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-success-surface p-2.5">
                      <dt className="text-xs text-ink-soft">Previstos</dt>
                      <dd className="mt-1 text-lg font-bold">{expected}</dd>
                    </div>
                    <div className="rounded-xl bg-primary/5 p-2.5">
                      <dt className="text-xs text-ink-soft">
                        Entradas registradas
                      </dt>
                      <dd className="mt-1 text-lg font-bold">{consumed}</dd>
                    </div>
                    <div className="rounded-xl bg-warning-surface p-2.5">
                      <dt className="text-xs text-ink-soft">Restantes</dt>
                      <dd className="mt-1 text-lg font-bold">{remaining}</dd>
                    </div>
                  </dl>
                  <details className="event-authorization-card__rules group mt-4 rounded-xl border border-border bg-surface-subtle/55 p-3">
                    <summary className="cursor-pointer list-none text-sm font-bold text-primary marker:hidden">
                      <span className="flex items-center justify-between gap-3">
                        Ver regras de veículos
                        <Icon
                          className="transition-transform group-open:rotate-180"
                          name="chevron-down"
                          size={16}
                        />
                      </span>
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm">
                      {event.vehicleRules.map((rule) => (
                        <li
                          className="flex flex-wrap justify-between gap-2 rounded-lg border border-border bg-surface p-2.5"
                          key={rule.id}
                        >
                          <span className="font-semibold">
                            {rule.plate
                              ? `Placa ${rule.plate}`
                              : rule.vehicleType}
                          </span>
                          <span className="text-ink-soft">
                            {rule.consumedQuantity} de {rule.quantity}{" "}
                            entrada(s)
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs font-semibold text-ink-soft">
                      {event.overnightAllowed
                        ? "Pernoite permitido"
                        : "Pernoite não permitido"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-warning-text">
                      A indicação de estacionamento não libera a entrada
                      automaticamente; cada acesso deve ser conferido e
                      registrado.
                    </p>
                    {event.notes && (
                      <p className="mt-2 text-sm leading-6 text-ink-soft">
                        {event.notes}
                      </p>
                    )}
                  </details>
                  {canManage && event.active && (
                    <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
                      <Button
                        className="flex-1"
                        disabled={pendingAction !== null}
                        onClick={() => onEdit(event)}
                        variant="secondary"
                      >
                        Editar
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={pendingAction !== null}
                        onClick={() => onCancel(event)}
                        variant="danger"
                      >
                        {pendingAction === `cancel-${event.id}`
                          ? "Cancelando…"
                          : "Cancelar autorização"}
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <EventCatalogFooter page={page} />
          {page.totalPages > 1 && (
            <nav
              aria-label="Paginação de autorizações"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5"
            >
              <Button
                disabled={page.page <= 1 || pendingAction !== null}
                onClick={() => onPageChange(page.page - 1)}
                variant="secondary"
              >
                Anterior
              </Button>
              <Button
                disabled={
                  page.page >= page.totalPages || pendingAction !== null
                }
                onClick={() => onPageChange(page.page + 1)}
                variant="secondary"
              >
                Próxima
              </Button>
            </nav>
          )}
        </>
      ) : null}
    </div>
  );
}

function EventCatalogFooter({ page }: { page: EventAuthorizationPage }) {
  return (
    <div className="institutional-catalog__footer flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
      <p aria-live="polite" className="text-sm text-ink-soft">
        Mostrando {page.items.length} de {page.totalCount} autorização(ões)
      </p>
      <p className="text-xs font-semibold text-ink-soft">
        Página {page.page} de {Math.max(page.totalPages, 1)}
      </p>
    </div>
  );
}
