import { Button } from "../../../components/ui/Button";
import type { AdministrativeReportResultPage } from "../types";

export function ReportPagination({
  page,
  onPageChange,
}: {
  page: AdministrativeReportResultPage;
  onPageChange: (page: number) => void;
}) {
  if (page.totalPages === 0) return null;

  return (
    <nav
      aria-label="Paginação do relatório"
      className="institutional-catalog__footer flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6"
    >
      <p className="text-sm text-text-muted">
        Página {page.page} de {page.totalPages} · {page.totalCount} registro(s)
      </p>
      <div className="flex gap-2">
        <Button
          disabled={page.page <= 1}
          onClick={() => onPageChange(page.page - 1)}
          variant="secondary"
        >
          Anterior
        </Button>
        <Button
          disabled={page.page >= page.totalPages}
          onClick={() => onPageChange(page.page + 1)}
          variant="secondary"
        >
          Próxima
        </Button>
      </div>
    </nav>
  );
}
