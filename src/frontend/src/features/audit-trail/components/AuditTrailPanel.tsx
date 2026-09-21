import { AccessDeniedState } from "../../../components/ui/AccessDeniedState";
import { ContentState } from "../../../components/ui/ContentState";
import { SectionHeader } from "../../../components/ui/SectionHeader";
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
      <SectionHeader
        className="px-5 pt-5 sm:px-6"
        description="Consulte ações registradas pelo sistema sem alterar ou excluir a autoria histórica."
        eyebrow="Consulta administrativa"
        title="Trilha de auditoria"
        titleId="audit-trail-title"
      />

      <AuditTrailFilters
        disabled={audit.status === "loading"}
        draft={audit.draft}
        errors={audit.filterErrors}
        onApply={audit.applyFilters}
        onChange={audit.setDraft}
        onClear={audit.clearFilters}
      />

      {audit.status === "error" && audit.errorMessage ? (
        <ContentState
          action={
            <button
              className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-700/30"
              onClick={audit.retry}
              type="button"
            >
              Tentar novamente
            </button>
          }
          className="m-5 sm:m-6"
          title={audit.errorMessage}
          variant="error"
        />
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
