import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { PageHeader } from "../components/ui/PageHeader";
import { AccessHistoryFilters } from "../features/access-records/components/AccessHistoryFilters";
import { AccessHistoryResults } from "../features/access-records/components/AccessHistoryResults";
import { useAccessHistory } from "../features/access-records/hooks/useAccessHistory";

export function HistoryPage() {
  const history = useAccessHistory();

  if (history.requestStatus === "denied") {
    return <AccessDeniedState message={history.errorMessage ?? undefined} />;
  }

  return (
    <div>
      <PageHeader
        description="Consulte entradas e saídas pelos filtros e limites aceitos pela API."
        eyebrow="Consulta e rastreabilidade"
        title="Histórico de acessos"
      />

      <section className="mt-7 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]">
        <AccessHistoryFilters
          draft={history.draft}
          onApply={history.applyFilters}
          onClear={history.clearFilters}
          onDraftChange={history.setDraft}
          onPeriodChange={history.selectPeriod}
          requestStatus={history.requestStatus}
        />
        <AccessHistoryResults
          errorMessage={history.errorMessage}
          onPageChange={history.goToPage}
          onRetry={history.retry}
          requestStatus={history.requestStatus}
          result={history.result}
        />
      </section>
    </div>
  );
}
