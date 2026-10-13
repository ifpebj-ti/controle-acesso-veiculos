import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { ContentState } from "../components/ui/ContentState";
import { Icon } from "../components/ui/Icon";
import { MetricCard, type MetricCardTone } from "../components/ui/MetricCard";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useAuthenticatedSession } from "../features/authentication";
import {
  EventAuthorizationCatalog,
  EventAuthorizationFilterForm,
  EventAuthorizationForm,
  type EventAuthorizationPage,
  useEventAuthorizations,
} from "../features/event-authorizations";
import { profileHasCapability } from "../routes/routeMetadata";

export function EventsPage() {
  const { user } = useAuthenticatedSession();
  const canManage = profileHasCapability(
    user.profileName,
    "manage-event-authorizations",
  );
  const events = useEventAuthorizations();

  if (events.status === "denied") {
    return <AccessDeniedState message={events.errorMessage ?? undefined} />;
  }

  return (
    <div>
      <PageHeader
        action={
          canManage ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-text hover:bg-primary-hover focus:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:bg-disabled-surface disabled:text-disabled-text disabled:opacity-100"
              disabled={events.pendingAction !== null}
              onClick={() => events.openForm()}
              type="button"
            >
              <Icon name="plus" size={18} /> Nova autorização
            </button>
          ) : undefined
        }
        description={
          canManage
            ? "Planeje autorizações antecipadas e acompanhe o uso das regras de acesso."
            : "Consulte autorizações, períodos, regras e quantidades registradas."
        }
        eyebrow={
          canManage ? "Planejamento e conferência" : "Consulta operacional"
        }
        title={
          canManage
            ? "Eventos e autorizações"
            : "Consultar eventos e autorizações"
        }
        variant="prominent"
      />

      {events.notice && (
        <div
          className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          role="status"
        >
          <p>{events.notice}</p>
          <button
            className="shrink-0 rounded-md font-bold underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            onClick={() => events.setNotice(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      {events.errorMessage && events.status !== "loading" && (
        <ContentState
          action={
            events.status === "error" ? (
              <button
                className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-700/30"
                onClick={events.retry}
                type="button"
              >
                Tentar novamente
              </button>
            ) : undefined
          }
          className="mt-6"
          title={events.errorMessage}
          variant="error"
        />
      )}

      {canManage && events.formOpen && (
        <>
          {events.formError && (
            <div
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
              role="alert"
            >
              {events.formError}
            </div>
          )}
          <EventAuthorizationForm
            busy={events.pendingAction !== null}
            event={events.selectedEvent}
            onCancel={events.closeForm}
            onSubmit={events.saveEvent}
            serverErrors={events.serverErrors}
          />
        </>
      )}

      <EventAuthorizationSummary page={events.page} status={events.status} />

      <EventAuthorizationFilterForm
        disabled={events.pendingAction !== null || events.status === "loading"}
        draft={events.draft}
        onApply={events.applyFilters}
        onChange={events.setDraft}
        onClear={events.clearFilters}
        periodError={events.filterError}
      />

      <section className="institutional-catalog mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(1,36,40,0.035)]">
        <SectionHeader
          className="px-5 pt-5 sm:px-6"
          eyebrow="Planejamento e acompanhamento"
          title="Eventos e autorizações cadastrados"
        />
        <EventAuthorizationCatalog
          canManage={canManage}
          onCancel={(event) => void events.cancelAuthorization(event)}
          onEdit={events.openForm}
          onPageChange={events.goToPage}
          page={events.page}
          pendingAction={events.pendingAction}
          status={events.status}
        />
      </section>
    </div>
  );
}

function EventAuthorizationSummary({
  page,
  status,
}: {
  page: EventAuthorizationPage | null;
  status: "loading" | "ready" | "error" | "denied";
}) {
  if (status !== "ready" || !page) return null;

  const visibleTotals = page.items.reduce(
    (totals, event) => {
      for (const rule of event.vehicleRules) {
        totals.expected += rule.quantity;
        totals.consumed += rule.consumedQuantity;
        totals.remaining += rule.remainingQuantity;
      }
      return totals;
    },
    { consumed: 0, expected: 0, remaining: 0 },
  );

  const metrics = [
    {
      description: "no período e filtros aplicados",
      icon: "calendar" as const,
      label: "Eventos encontrados",
      tone: "forest" as MetricCardTone,
      value: page.totalCount,
    },
    {
      description: "na página atual",
      icon: "clipboard" as const,
      label: "Capacidade prevista",
      tone: "leaf" as MetricCardTone,
      value: visibleTotals.expected,
    },
    {
      description: "na página atual",
      icon: "log-out" as const,
      label: "Entradas utilizadas",
      tone: "teal" as MetricCardTone,
      value: visibleTotals.consumed,
    },
    {
      description: "na página atual",
      icon: "clock" as const,
      label: "Autorizações restantes",
      tone: "amber" as MetricCardTone,
      value: visibleTotals.remaining,
    },
  ];

  return (
    <section
      aria-label="Resumo dos eventos e autorizações"
      className="institutional-metric-grid mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <MetricCard
          description={metric.description}
          icon={metric.icon}
          key={metric.label}
          label={metric.label}
          tone={metric.tone}
          value={metric.value}
        />
      ))}
    </section>
  );
}
