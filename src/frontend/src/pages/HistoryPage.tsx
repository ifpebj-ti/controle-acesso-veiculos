import { useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { ActionFeedback } from "../components/ui/ActionFeedback";
import { PageHeader } from "../components/ui/PageHeader";
import { AccessCorrectionDialog } from "../features/access-records/components/AccessCorrectionDialog";
import { AccessDetailsDialog } from "../features/access-records/components/AccessDetailsDialog";
import { AccessHistoryCategoryTabs } from "../features/access-records/components/AccessHistoryCategoryTabs";
import { AccessHistoryFilters } from "../features/access-records/components/AccessHistoryFilters";
import { AccessHistoryResults } from "../features/access-records/components/AccessHistoryResults";
import { useAccessHistory } from "../features/access-records/hooks/useAccessHistory";
import type { AccessRecord } from "../features/access-records";
import { useAuthenticatedSession } from "../features/authentication";
import { profileHasCapability } from "../routes/routeMetadata";

interface ActiveCorrection {
  record: AccessRecord;
  trigger: HTMLButtonElement;
}

interface ActiveDetails {
  record: AccessRecord;
  trigger: HTMLButtonElement;
}

export function HistoryPage() {
  const { user } = useAuthenticatedSession();
  const history = useAccessHistory();
  const [activeCorrection, setActiveCorrection] =
    useState<ActiveCorrection | null>(null);
  const [activeDetails, setActiveDetails] = useState<ActiveDetails | null>(
    null,
  );
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [successNeedsFocus, setSuccessNeedsFocus] = useState(false);
  const canCorrect = profileHasCapability(
    user.profileName,
    "correct-general-access",
  );

  function openCorrection(record: AccessRecord, trigger: HTMLButtonElement) {
    setSuccessNotice(null);
    setSuccessNeedsFocus(false);
    setActiveCorrection({ record, trigger });
  }

  function openDetails(record: AccessRecord, trigger: HTMLButtonElement) {
    setActiveDetails({ record, trigger });
  }

  function correctFromDetails() {
    if (!activeDetails || !canCorrect) return;
    setSuccessNotice(null);
    setSuccessNeedsFocus(false);
    setActiveCorrection(activeDetails);
    setActiveDetails(null);
  }

  async function finishCorrection(record: AccessRecord) {
    const trigger = activeCorrection?.trigger;
    setActiveCorrection(null);
    setSuccessNeedsFocus(false);
    setSuccessNotice(`Registro #${record.id} corrigido com sucesso.`);

    const refreshed = await history.revalidateAfterCorrection(record);
    if (
      !trigger?.isConnected ||
      !refreshed?.items.some(({ id }) => id === record.id)
    ) {
      setSuccessNeedsFocus(true);
    }
  }

  if (history.requestStatus === "denied") {
    return <AccessDeniedState message={history.errorMessage ?? undefined} />;
  }

  return (
    <div>
      <PageHeader
        description="Consulte os registros de entrada e saída de veículos, com possibilidade de filtros e detalhamento das informações."
        eyebrow="Operação da portaria"
        title="Histórico de acessos"
        variant="prominent"
      />

      <AccessHistoryCategoryTabs
        activeCategory={history.draft.categoryName}
        categoryCounts={history.categoryCounts}
        categoryCountsStatus={history.categoryCountsStatus}
        onSelect={history.selectCategory}
        onShowMore={() => {
          document.getElementById("history-category")?.focus();
          document
            .getElementById("history-category")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
        requestStatus={history.requestStatus}
      />

      {successNotice && (
        <ActionFeedback
          className="font-semibold"
          floating
          focusOnChange={successNeedsFocus}
          message={successNotice}
          onDismiss={() => setSuccessNotice(null)}
          tone="success"
        />
      )}

      <section className="institutional-catalog mt-5 overflow-hidden rounded-[2rem] border border-border bg-surface">
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
          onDetails={openDetails}
          onCorrect={canCorrect ? openCorrection : undefined}
          requestStatus={history.requestStatus}
          result={history.result}
        />
      </section>

      {activeDetails && (
        <AccessDetailsDialog
          onClose={() => setActiveDetails(null)}
          onCorrect={canCorrect ? correctFromDetails : undefined}
          record={activeDetails.record}
          returnFocusTo={activeDetails.trigger}
        />
      )}

      {activeCorrection && (
        <AccessCorrectionDialog
          onClose={() => setActiveCorrection(null)}
          onCorrected={finishCorrection}
          record={activeCorrection.record}
          returnFocusTo={activeCorrection.trigger}
        />
      )}
    </div>
  );
}
