import { useEffect, useRef, useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { PageHeader } from "../components/ui/PageHeader";
import { AccessCorrectionDialog } from "../features/access-records/components/AccessCorrectionDialog";
import { AccessHistoryFilters } from "../features/access-records/components/AccessHistoryFilters";
import { AccessHistoryResults } from "../features/access-records/components/AccessHistoryResults";
import { useAccessHistory } from "../features/access-records/hooks/useAccessHistory";
import type { AccessRecord } from "../features/access-records";
import { useAuthenticatedSession } from "../features/authentication";

const correctionProfiles = ["Porteiro", "Vigilante", "Administrador"];

interface ActiveCorrection {
  record: AccessRecord;
  trigger: HTMLButtonElement;
}

export function HistoryPage() {
  const { user } = useAuthenticatedSession();
  const history = useAccessHistory();
  const [activeCorrection, setActiveCorrection] =
    useState<ActiveCorrection | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [successFocusRequest, setSuccessFocusRequest] = useState(0);
  const successNoticeRef = useRef<HTMLDivElement>(null);
  const canCorrect = correctionProfiles.includes(user.profileName);

  useEffect(() => {
    if (successFocusRequest === 0) return;
    successNoticeRef.current?.focus({ preventScroll: true });
  }, [successFocusRequest]);

  function openCorrection(record: AccessRecord, trigger: HTMLButtonElement) {
    setSuccessNotice(null);
    setActiveCorrection({ record, trigger });
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
        description="Consulte entradas e saídas pelos filtros e limites aceitos pela API."
        eyebrow="Consulta e rastreabilidade"
        title="Histórico de acessos"
      />

      {successNotice && (
        <div
          className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-950"
          ref={successNoticeRef}
          role="status"
          tabIndex={-1}
        >
          {successNotice}
        </div>
      )}

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
          onCorrect={canCorrect ? openCorrection : undefined}
          requestStatus={history.requestStatus}
          result={history.result}
        />
      </section>

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
