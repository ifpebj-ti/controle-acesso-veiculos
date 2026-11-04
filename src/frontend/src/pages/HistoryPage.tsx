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
import { CorrectionReviewScope } from "../features/access-corrections/CorrectionReviewScope";
import { useCorrectionStore } from "../features/access-corrections/correctionIntentContext";
import { CorrectionQueue } from "../features/access-corrections/CorrectionQueue";
import type { CorrectionRequest } from "../features/access-corrections/schemas";

interface ActiveCorrection {
  record: AccessRecord;
  trigger: HTMLButtonElement;
}

interface ActiveDetails {
  record: AccessRecord;
  trigger: HTMLButtonElement;
}

function HistoryContent() {
  const { user } = useAuthenticatedSession();
  const history = useAccessHistory();
  const store = useCorrectionStore();
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
    store.begin(record);
    setSuccessNotice(null);
    setSuccessNeedsFocus(false);
    setActiveCorrection({ record, trigger });
  }

  function openDetails(record: AccessRecord, trigger: HTMLButtonElement) {
    setActiveDetails({ record, trigger });
  }

  function correctFromDetails() {
    if (!activeDetails || !canCorrect) return;
    store.begin(activeDetails.record);
    setSuccessNotice(null);
    setSuccessNeedsFocus(false);
    setActiveCorrection(activeDetails);
    setActiveDetails(null);
  }

  function finishRequest(request: CorrectionRequest) {
    setActiveCorrection((current) =>
      current?.record.id === request.accessRecordId ? null : current,
    );
    if (request.status === "Aprovada") {
      void finishApproval(request);
      return;
    }
    setSuccessNeedsFocus(false);
    setSuccessNotice(
      `Solicitação #${request.id}: ${request.status}. O envio não aplica a correção nem bloqueia a saída normal.`,
    );
  }
  async function finishApproval(request: CorrectionRequest) {
    setSuccessNeedsFocus(false);
    setSuccessNotice(
      `Solicitação #${request.id} aprovada. Atualizando os registros.`,
    );
    const refreshed = await history.revalidateAfterApproval(
      request.accessRecordId,
    );
    setSuccessNotice(
      refreshed
        ? refreshed.items.some(({ id }) => id === request.accessRecordId)
          ? `Solicitação #${request.id} aprovada. Registro atualizado a partir da consulta.`
          : `Solicitação #${request.id} aprovada. O registro não aparece no resultado consultado. Os filtros foram preservados.`
        : `Solicitação #${request.id} aprovada, mas a consulta dos registros não foi concluída. Atualize sem repetir a decisão.`,
    );
    setSuccessNeedsFocus(true);
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

      <CorrectionQueue
        onResume={openCorrection}
        onApproved={(request) => void finishApproval(request)}
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
          onRequested={finishRequest}
          onReload={history.retry}
          record={activeCorrection.record}
          returnFocusTo={activeCorrection.trigger}
        />
      )}
    </div>
  );
}

export function HistoryPage() {
  return (
    <CorrectionReviewScope>
      <HistoryContent />
    </CorrectionReviewScope>
  );
}
