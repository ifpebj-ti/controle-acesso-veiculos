import { AccessDeniedState } from "../../../components/ui/AccessDeniedState";
import { AuditTrailFilters } from "./AuditTrailFilters";
import { AuditTrailResults } from "./AuditTrailResults";
import { useAuditTrail } from "../hooks/useAuditTrail";

export function AuditTrailPanel({ enabled }: { enabled: boolean }) {
  const audit = useAuditTrail(enabled);

  if (audit.status === "denied") {
    return (
      <div className="mt-7">
        <AccessDeniedState
          message={
            audit.errorMessage ??
            "Seu perfil não possui permissão para consultar a auditoria."
          }
        />
      </div>
    );
  }

  return (
    <section
      aria-busy={audit.status === "loading"}
      aria-labelledby="audit-trail-title"
      className="mt-7 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]"
    >
      <div className="px-5 pt-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Consulta administrativa
        </p>
        <h2
          className="mt-1 font-display text-2xl text-ink"
          id="audit-trail-title"
        >
          Trilha de auditoria
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/60">
          Consulte ações registradas pelo sistema sem alterar ou excluir a
          autoria histórica.
        </p>
      </div>

      <AuditTrailFilters
        disabled={audit.status === "loading"}
        draft={audit.draft}
        errors={audit.filterErrors}
        onApply={audit.applyFilters}
        onChange={audit.setDraft}
        onClear={audit.clearFilters}
      />

      {audit.status === "error" && audit.errorMessage ? (
        <div
          className="m-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 sm:m-6"
          role="alert"
        >
          <p>{audit.errorMessage}</p>
          <button
            className="mt-4 min-h-10 rounded-xl border border-red-300 px-4 font-bold"
            onClick={audit.retry}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <AuditTrailResults
          onPageChange={audit.goToPage}
          page={audit.page}
          status={audit.status}
        />
      )}
    </section>
  );
}
