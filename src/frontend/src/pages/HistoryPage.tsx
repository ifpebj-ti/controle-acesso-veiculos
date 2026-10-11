import { useEffect, useRef, useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
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
  const [successFocusRequest, setSuccessFocusRequest] = useState(0);
  const successNoticeRef = useRef<HTMLDivElement>(null);
  const canCorrect = profileHasCapability(
    user.profileName,
    "correct-general-access",
  );

  useEffect(() => {
    if (successFocusRequest === 0) return;
    successNoticeRef.current?.focus({ preventScroll: true });
  }, [successFocusRequest]);

  function openCorrection(record: AccessRecord, trigger: HTMLButtonElement) {
    setSuccessNotice(null);
    setActiveCorrection({ record, trigger });
  }

  function openDetails(record: AccessRecord, trigger: HTMLButtonElement) {
    setActiveDetails({ record, trigger });
  }

  function correctFromDetails() {
    if (!activeDetails || !canCorrect) return;
    setSuccessNotice(null);
    setActiveCorrection(activeDetails);
    setActiveDetails(null);
  }

  async function finishCorrection(record: AccessRecord) {
    const trigger = activeCorrection?.trigger;
    setActiveCorrection(null);
    setSuccessNotice(`Registro #${record.id} corrigido com sucesso.`);

    const refreshed = await history.revalidateAfterCorrection(record);
    if (
      !trigger?.isConnected ||
      !refreshed?.items.some(({ id }) => id === record.id)
    ) {
      setSuccessFocusRequest((request) => request + 1);
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
        <div
          className="mt-5 rounded-xl border border-success-border bg-success-surface p-4 text-sm font-semibold text-success-text"
          ref={successNoticeRef}
          role="status"
          tabIndex={-1}
        >
          {successNotice}
        </div>
      )}

      <section className="mt-5 overflow-hidden rounded-xl border border-border bg-surface">
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
