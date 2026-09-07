import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuthenticatedSession } from "../features/authentication";
import {
  InstitutionalDepartureForm,
  InstitutionalUsageHistory,
  OpenInstitutionalUsages,
  useInstitutionalUsageCatalogs,
  useInstitutionalUsageHistory,
  useInstitutionalUsageOperations,
} from "../features/institutional-usages";

const operationalProfiles = ["Porteiro", "Vigilante", "Administrador"];
const reviewProfiles = ["SetorTransporte", "Administrador"];

export function InstitutionalUsagesPage() {
  const { user } = useAuthenticatedSession();
  const canOperate = operationalProfiles.includes(user.profileName);
  const canReview = reviewProfiles.includes(user.profileName);
  const catalogs = useInstitutionalUsageCatalogs();
  const operations = useInstitutionalUsageOperations(canOperate);
  const history = useInstitutionalUsageHistory(canReview);

  if (
    catalogs.status === "denied" ||
    operations.status === "denied" ||
    history.status === "denied"
  ) {
    return (
      <AccessDeniedState
        message={
          catalogs.errorMessage ??
          operations.errorMessage ??
          history.errorMessage ??
          undefined
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        action={
          canOperate ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30 disabled:cursor-wait disabled:opacity-60"
              disabled={
                catalogs.status !== "ready" || operations.pendingAction !== null
              }
              onClick={operations.openDeparture}
              type="button"
            >
              <Icon name="plus" size={18} /> Registrar saída
            </button>
          ) : undefined
        }
        description={
          canOperate && canReview
            ? "Registre saídas e retornos da frota e consulte o histórico institucional."
            : canOperate
              ? "Registre saídas e retornos usando veículos e motoristas previamente autorizados."
              : "Consulte o histórico da frota sem executar movimentações operacionais."
        }
        eyebrow={canOperate ? "Operação institucional" : "Supervisão"}
        title="Utilizações da frota"
      />

      {catalogs.status === "error" && catalogs.errorMessage && (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          role="alert"
        >
          <p>
            Os catálogos de veículos e motoristas estão indisponíveis. A
            consulta já carregada permanece independente.{" "}
            {catalogs.errorMessage}
          </p>
          <button
            className="min-h-10 rounded-xl border border-amber-300 px-4 font-bold"
            onClick={() => void catalogs.load()}
            type="button"
          >
            Recarregar catálogos
          </button>
        </div>
      )}

      {operations.notice && (
        <div
          className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          role="status"
        >
          <p>{operations.notice}</p>
          <button
            className="shrink-0 rounded-md font-bold underline underline-offset-4"
            onClick={() => operations.setNotice(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      {operations.status === "error" && operations.errorMessage && (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          <p>{operations.errorMessage}</p>
          <button
            className="min-h-10 rounded-xl border border-red-300 px-4 font-bold"
            onClick={() => void operations.load()}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {canOperate && operations.departureOpen && (
        <>
          {operations.formError && (
            <div
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
              role="alert"
            >
              {operations.formError}
            </div>
          )}
          <InstitutionalDepartureForm
            busy={operations.pendingAction !== null}
            drivers={catalogs.drivers}
            onCancel={operations.closeDeparture}
            onSubmit={operations.saveDeparture}
            serverErrors={operations.serverErrors}
            vehicles={catalogs.vehicles}
          />
        </>
      )}

      {canOperate && (
        <OpenInstitutionalUsages
          formError={operations.formError}
          onCloseReturn={operations.closeReturn}
          onOpenReturn={operations.openReturn}
          onReturn={operations.saveReturn}
          pendingAction={operations.pendingAction}
          returningUsage={operations.returningUsage}
          serverErrors={operations.serverErrors}
          status={operations.status}
          usages={operations.usages}
        />
      )}

      {canReview && (
        <InstitutionalUsageHistory
          catalogsReady={catalogs.status === "ready"}
          draft={history.draft}
          drivers={catalogs.drivers}
          errorMessage={history.errorMessage}
          onApply={history.applyFilters}
          onChange={history.setDraft}
          onClear={history.clearFilters}
          onPageChange={history.goToPage}
          onRetry={history.retry}
          page={history.page}
          periodError={history.filterError}
          status={history.status}
          vehicles={catalogs.vehicles}
        />
      )}
    </div>
  );
}
