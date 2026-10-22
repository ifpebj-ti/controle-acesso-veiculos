import { useCallback, useRef, useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
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
        description="Consulte registros reais por período e exporte uma cópia identificada pela API."
        eyebrow="Administração"
        title="Relatórios"
        variant="prominent"
      />

      <ReportKindSelector kind={report.kind} onChange={report.changeKind} />

      {exportNotice && (
        <div
          aria-atomic="true"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success-border bg-success-surface p-4 text-sm text-success-text"
          role="status"
        >
          <p>{exportNotice}</p>
          <button
            className="min-h-10 font-bold underline underline-offset-4"
            onClick={() => setExportNotice(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      <ReportFilters
        draft={report.draft}
        kind={report.kind}
        onChange={report.setDraft}
        onSubmit={report.applyFilters}
        validationMessage={report.validationMessage}
      />
      <p className="mt-4 text-sm text-text-muted">
        Período aplicado: <strong>{report.applied.from}</strong> a{" "}
        <strong>{report.applied.to}</strong>, inclusive. Máximo de 31 dias.
      </p>

      <ReportContent report={report} />

      <aside className="mt-6 rounded-2xl border border-warning-border bg-warning-surface p-5 text-sm leading-6 text-text-muted">
        <h2 className="font-bold text-text">Confirmação da exportação</h2>
        <p className="mt-1">
          A exportação é exclusiva do Administrador e exige a confirmação da
          senha administrativa atual. A senha é enviada somente nesta tentativa
          e apagada do formulário em seguida.
        </p>
      </aside>

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
        className="mt-5"
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
        className="mt-5"
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
          className="mt-5"
          description="Altere o período ou os filtros para realizar outra consulta."
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
    <>
      <ReportResults kind={report.kind} page={report.page} />
      <ReportPagination onPageChange={report.goToPage} page={report.page} />
    </>
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
    <div
      aria-label="Tipo de relatório"
      className="mt-6 grid gap-2 rounded-2xl border border-border bg-surface p-2 sm:grid-cols-2"
      role="group"
    >
      <ReportKindButton
        active={kind === "movements"}
        label="Movimentações gerais"
        onClick={() => onChange("movements")}
      />
      <ReportKindButton
        active={kind === "fleet"}
        label="Frota institucional"
        onClick={() => onChange("fleet")}
      />
    </div>
  );
}

function ReportKindButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`min-h-12 rounded-xl px-4 text-sm font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-focus ${active ? "bg-primary text-primary-text" : "text-text hover:bg-surface-subtle"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
