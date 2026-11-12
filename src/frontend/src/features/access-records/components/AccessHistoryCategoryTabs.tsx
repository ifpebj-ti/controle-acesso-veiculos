import { useId } from "react";
import { Button } from "../../../components/ui/Button";
import { Icon, type IconName } from "../../../components/ui/Icon";
import type { AccessHistoryRequestStatus } from "../hooks/useAccessHistory";
import { useHistoryCategoryShelfScroll } from "../hooks/useHistoryCategoryShelfScroll";
import {
  generalAccessCategories,
  type GeneralAccessCategory,
} from "../model/accessCategories";

interface AccessHistoryCategoryTabsProps {
  activeCategory: string;
  categoryCounts: Record<string, number> | null;
  categoryCountsStatus: "loading" | "ready" | "error";
  onSelect: (category: string) => void;
  requestStatus: AccessHistoryRequestStatus;
}

const categoryIcons: Record<GeneralAccessCategory, IconName> = {
  Aluno: "user",
  Terceirizado: "wrench",
  Federal: "user",
  "Caminhada com veículo": "vehicle",
  Mototáxi: "motorcycle",
  "Permanência excepcional": "clock",
  "Outro acesso autorizado": "clipboard",
  Entrega: "package",
  Evento: "users",
  "Prestador de serviço": "wrench",
  "Treino ou jogo": "trophy",
  Visitante: "user",
};

function FolderShape() {
  return (
    <svg
      aria-hidden="true"
      className="history-category-shape"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 200 118"
    >
      <path d="M0 16V12C0 5 5 0 12 0H75C81 0 85 3 88 9L92 16H186C194 16 200 22 200 30V104C200 112 194 118 186 118H14C6 118 0 112 0 104Z" />
      <path
        className="history-category-accent"
        d="M1.5 19V102C1.5 110 6 115 13 116.5"
      />
    </svg>
  );
}

export function AccessHistoryCategoryTabs({
  activeCategory,
  categoryCounts,
  categoryCountsStatus,
  onSelect,
  requestStatus,
}: AccessHistoryCategoryTabsProps) {
  const isLoading = requestStatus === "loading";
  const {
    edges,
    moveViewport,
    navigateCategories,
    revealCategory,
    updateEdges,
    viewportRef,
  } = useHistoryCategoryShelfScroll(activeCategory);
  const shelfId = useId();
  const hintId = `${shelfId}-hint`;

  return (
    <section
      aria-labelledby="history-category-shortcuts-title"
      className="history-category-shelf mt-6 rounded-2xl border border-border px-3 pt-2 sm:px-4"
    >
      <h2 className="sr-only" id="history-category-shortcuts-title">
        Filtros rápidos por categoria
      </h2>

      <div className="flex min-h-12 items-center justify-between gap-3 pb-1">
        <p className="text-sm text-text-muted" id={hintId}>
          {edges.previous || edges.next
            ? "Deslize ou use as setas para ver todas as categorias."
            : "Selecione uma categoria para filtrar os registros."}
        </p>
        {(edges.previous || edges.next) && (
          <div className="flex shrink-0 gap-2">
            <Button
              aria-controls={shelfId}
              aria-label="Ver categorias anteriores"
              disabled={!edges.previous}
              onClick={() => moveViewport(-1)}
              type="button"
              variant="secondary"
            >
              <Icon name="chevron-down" className="rotate-90" size={20} />
            </Button>
            <Button
              aria-controls={shelfId}
              aria-label="Ver próximas categorias"
              disabled={!edges.next}
              onClick={() => moveViewport(1)}
              type="button"
              variant="secondary"
            >
              <Icon name="chevron-down" className="-rotate-90" size={20} />
            </Button>
          </div>
        )}
      </div>
      <div
        aria-describedby={hintId}
        aria-label="Categorias do histórico"
        role="group"
        id={shelfId}
        ref={viewportRef}
        onScroll={updateEdges}
        onKeyDown={navigateCategories}
        onFocus={(event) => {
          if (event.target instanceof HTMLButtonElement)
            revealCategory(event.target);
        }}
        className="history-category-tabs overflow-x-auto px-2 pb-3 pt-4"
      >
        <div className="flex w-max gap-3">
          {generalAccessCategories.map((label, index) => {
            const isActive = activeCategory === label;
            const count = categoryCounts?.[label];

            return (
              <button
                aria-pressed={isActive}
                aria-labelledby={`${shelfId}-label-${index}`}
                aria-disabled={isLoading || undefined}
                aria-describedby={`${shelfId}-count-${index}`}
                className="history-category-card"
                data-active={isActive || undefined}
                key={label}
                onClick={() => {
                  if (!isLoading) onSelect(isActive ? "" : label);
                }}
                type="button"
              >
                <FolderShape />
                <span
                  aria-hidden="true"
                  className="history-category-count"
                  title={
                    categoryCountsStatus === "ready" && count !== undefined
                      ? `${count} registros no período e filtros atuais`
                      : undefined
                  }
                >
                  {categoryCountsStatus === "loading" ? "…" : (count ?? "—")}
                </span>
                <Icon name={categoryIcons[label]} size={26} />
                <span id={`${shelfId}-label-${index}`}>{label}</span>
                <span className="sr-only" id={`${shelfId}-count-${index}`}>
                  {categoryCountsStatus === "loading"
                    ? "Carregando contagem."
                    : categoryCountsStatus === "ready" && count !== undefined
                      ? `${count} registros no período e filtros atuais.`
                      : "Contagem indisponível."}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {categoryCountsStatus === "error" && (
        <p className="pb-3 text-sm text-text-muted" role="status">
          As contagens estão indisponíveis. Você ainda pode filtrar por
          categoria.
        </p>
      )}
    </section>
  );
}
