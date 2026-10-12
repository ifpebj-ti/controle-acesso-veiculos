import { AccessDeniedState } from "../../../components/ui/AccessDeniedState";
import { ContentState } from "../../../components/ui/ContentState";
import {
  MetricCard,
  type MetricCardTone,
} from "../../../components/ui/MetricCard";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import type { AuditTrailPage } from "../types";
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
      className="mt-4"
    >
      <div className="sr-only">
        <SectionHeader
          description="Consulte ações registradas pelo sistema sem alterar ou excluir a autoria histórica."
          eyebrow="Consulta administrativa"
          title="Trilha de auditoria"
          titleId="audit-trail-title"
        />
      </div>

      <AuditTrailSummary page={audit.page} status={audit.status} />

      <section className="institutional-catalog mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(1,36,40,0.035)]">
        <SectionHeader
          className="px-5 pt-5 sm:px-6"
          description="Consulte ações registradas pelo sistema sem alterar ou excluir a autoria histórica."
          eyebrow="Consulta administrativa"
          title="Filtros da trilha de auditoria"
        />
        <AuditTrailFilters
          disabled={audit.status === "loading"}
          draft={audit.draft}
          errors={audit.filterErrors}
          onApply={audit.applyFilters}
          onChange={audit.setDraft}
          onClear={audit.clearFilters}
        />
      </section>

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
          className="mt-4"
          title={audit.errorMessage}
          variant="error"
        />
      ) : (
        <div className="institutional-catalog mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(1,36,40,0.035)]">
          <AuditTrailResults
            onPageChange={audit.goToPage}
            page={audit.page}
            status={audit.status}
          />
        </div>
      )}
    </section>
  );
}

function AuditTrailSummary({
  page,
  status,
}: {
  page: AuditTrailPage | null;
  status: "idle" | "loading" | "ready" | "error" | "denied";
}) {
  if (status !== "ready" || !page) return null;

  const countOnPage = (action: AuditTrailPage["items"][number]["action"]) =>
    page.items.filter((entry) => entry.action === action).length;
  const metrics = [
    {
      description: "nos filtros aplicados",
      icon: "clipboard" as const,
      label: "Total de registros",
      tone: "forest" as MetricCardTone,
      value: page.totalCount,
    },
    {
      description: "na página atual",
      icon: "user" as const,
      label: "Logins",
      tone: "leaf" as MetricCardTone,
      value: countOnPage("Login"),
    },
    {
      description: "na página atual",
      icon: "clipboard" as const,
      label: "Alterações",
      tone: "amber" as MetricCardTone,
      value: countOnPage("Alteracao"),
    },
    {
      description: "na página atual",
      icon: "x" as const,
      label: "Exclusões",
      tone: "red" as MetricCardTone,
      value: countOnPage("Exclusao"),
    },
  ];

  return (
    <section
      aria-label="Resumo da trilha de auditoria"
      className="institutional-metric-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
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
