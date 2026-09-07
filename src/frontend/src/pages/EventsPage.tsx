import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuthenticatedSession } from "../features/authentication";
import {
  EventAuthorizationCatalog,
  EventAuthorizationFilterForm,
  EventAuthorizationForm,
  useEventAuthorizations,
} from "../features/event-authorizations";

const manageableProfiles = ["SetorTransporte", "Administrador"];

export function EventsPage() {
  const { user } = useAuthenticatedSession();
  const canManage = manageableProfiles.includes(user.profileName);
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
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30 disabled:cursor-wait disabled:opacity-60"
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
            : "Confira autorizações vigentes e veículos previstos antes de registrar a entrada."
        }
        eyebrow={
          canManage ? "Planejamento e conferência" : "Consulta operacional"
        }
        title={canManage ? "Eventos e autorizações" : "Conferir autorizações"}
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
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          <p>{events.errorMessage}</p>
          {events.status === "error" && (
            <button
              className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
              onClick={events.retry}
              type="button"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {events.formOpen && (
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

      <section className="mt-7 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]">
        <div className="px-5 pt-5 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
            Consulta integrada
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">
            Autorizações cadastradas
          </h2>
        </div>
        <EventAuthorizationFilterForm
          disabled={
            events.pendingAction !== null || events.status === "loading"
          }
          draft={events.draft}
          onApply={events.applyFilters}
          onChange={events.setDraft}
          onClear={events.clearFilters}
          periodError={events.filterError}
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
