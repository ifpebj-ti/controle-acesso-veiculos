import { useCallback, useRef, useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { ActionFeedback } from "../components/ui/ActionFeedback";
import { Button } from "../components/ui/Button";
import { ContentState } from "../components/ui/ContentState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { ReportExportDialog } from "../features/administrative-reports/components/ReportExportDialog";
import { ReportFilters } from "../features/administrative-reports/components/ReportFilters";
import { ReportPagination } from "../features/administrative-reports/components/ReportPagination";
import { ReportResults } from "../features/administrative-reports/components/ReportResults";
import { useAdministrativeReport } from "../features/administrative-reports/hooks/useAdministrativeReport";
import type { AdministrativeReportKind } from "../features/administrative-reports/types";
import { useAuthenticatedSession } from "../features/authentication";
import { profileHasCapability } from "../routes/routeMetadata";

export function ReportsPage() {
  const { user } = useAuthenticatedSession();
  if (
    !profileHasCapability(user.profileName, "review-administrative-reports")
  ) {
    return (
      <AccessDeniedState message="Os relatórios são exclusivos do perfil Administrador." />
    );
  }
  return <AdministratorReports />;
}

function AdministratorReports() {
  const report = useAdministrativeReport();
  const [exportOpen, setExportOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const exportTriggerRef = useRef<HTMLButtonElement>(null);
  const closeExport = useCallback(() => setExportOpen(false), []);

  if (report.status === "denied") {
    return <AccessDeniedState message={report.errorMessage ?? undefined} />;
  }

  return (
    <div>
      <PageHeader
        action={
          <Button
            disabled={report.status === "loading"}
            onClick={() => setExportOpen(true)}
            ref={exportTriggerRef}
          >
            <Icon name="clipboard" size={18} /> Exportar PDF
          </Button>
        }
        description="Consulte as movimentações por período e exporte uma cópia em PDF."
        eyebrow="Administração"
        title="Relatórios"
        variant="prominent"
      />

      <ReportKindSelector kind={report.kind} onChange={report.changeKind} />

      {exportNotice && (
        <ActionFeedback
          className="mt-5"
          floating
          focusOnChange
          message={exportNotice}
          onDismiss={() => setExportNotice(null)}
          tone="success"
        />
      )}

      <ReportFilters
        draft={report.draft}
        kind={report.kind}
        onChange={report.setDraft}
        onClear={report.clearFilters}
        onSubmit={report.applyFilters}
        validationMessage={report.validationMessage}
      />
      <ReportContent report={report} />

      {exportOpen && (
        <ReportExportDialog
          applied={report.applied}
          kind={report.kind}
          onClose={closeExport}
          onSuccess={() =>
            setExportNotice("O download do relatório foi iniciado.")
          }
          returnFocusTo={exportTriggerRef}
        />
      )}
    </div>
  );
}

function ReportContent({
  report,
}: {
  report: ReturnType<typeof useAdministrativeReport>;
}) {
  if (report.status === "loading") {
    return (
      <ContentState
        className="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6"
        title="Carregando relatório"
        variant="loading"
      />
    );
  }
  if (report.status === "error") {
    return (
      <ContentState
        action={
          <Button onClick={report.retry} variant="secondary">
            Tentar novamente
          </Button>
        }
        className="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6"
        description="Os filtros e o período foram preservados."
        title={report.errorMessage ?? "O relatório está indisponível agora."}
        variant="error"
      />
    );
  }
  if (!report.page || report.page.items.length === 0) {
    return (
      <>
        <ContentState
          className="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6"
          description={`Nenhum registro entre ${report.applied.from} e ${report.applied.to}. Altere o período ou os filtros para realizar outra consulta.`}
          icon="search"
          title="Nenhum registro encontrado"
          variant="empty"
        />
        {report.page && (
          <ReportPagination onPageChange={report.goToPage} page={report.page} />
        )}
      </>
    );
  }
  return (
    <ReportResults
      kind={report.kind}
      onPageChange={report.goToPage}
      page={report.page}
    />
  );
}

function ReportKindSelector({
  kind,
  onChange,
}: {
  kind: AdministrativeReportKind;
  onChange: (kind: AdministrativeReportKind) => void;
}) {
  return (
    <nav
      aria-label="Tipo de relatório"
      className="admin-area-tabs mt-6 flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1"
    >
      <ReportKindButton
        active={kind === "movements"}
        description="Entradas, saídas, categorias e responsáveis pelos registros."
        icon="history"
        label="Movimentações gerais"
        onClick={() => onChange("movements")}
      />
      <ReportKindButton
        active={kind === "fleet"}
        description="Saídas, retornos, itinerários e quilometragem da frota."
        icon="truck"
        label="Frota institucional"
        onClick={() => onChange("fleet")}
      />
    </nav>
  );
}

function ReportKindButton({
  active,
  description,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  icon: "history" | "truck";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-describedby={`report-kind-${icon}-description`}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 ${active ? "bg-primary text-primary-text shadow-sm" : "text-primary hover:bg-primary/5"}`}
      onClick={onClick}
      type="button"
    >
      <Icon name={icon} size={17} />
      {label}
      <span className="sr-only" id={`report-kind-${icon}-description`}>
        {description}
      </span>
    </button>
  );
}
