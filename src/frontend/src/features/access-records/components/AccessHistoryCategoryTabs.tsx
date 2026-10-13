import { Icon, type IconName } from "../../../components/ui/Icon";
import type { AccessHistoryRequestStatus } from "../hooks/useAccessHistory";
import { featuredAccessCategories } from "../model/accessCategories";

interface AccessHistoryCategoryTabsProps {
  activeCategory: string;
  categoryCounts: Record<string, number> | null;
  categoryCountsStatus: "loading" | "ready" | "error";
  onSelect: (category: string) => void;
  onShowMore: () => void;
  requestStatus: AccessHistoryRequestStatus;
}

const featuredCategoryIcons: Record<string, IconName> = {
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
  onShowMore,
  requestStatus,
}: AccessHistoryCategoryTabsProps) {
  const isLoading = requestStatus === "loading";
  const isAdditionalCategory =
    activeCategory.length > 0 &&
    !featuredAccessCategories.includes(
      activeCategory as (typeof featuredAccessCategories)[number],
    );

  return (
    <section
      aria-labelledby="history-category-shortcuts-title"
      className="history-category-shelf mt-6 rounded-2xl border border-border px-3 pt-2 sm:px-4"
    >
      <h2 className="sr-only" id="history-category-shortcuts-title">
        Filtros rápidos por categoria
      </h2>

      <div className="history-category-tabs overflow-x-auto px-0.5 pb-3 pt-4">
        <div className="grid min-w-max grid-cols-6 gap-3 xl:min-w-0">
          {featuredAccessCategories.map((label) => {
            const isActive = activeCategory === label;
            const count = categoryCounts?.[label];

            return (
              <button
                aria-pressed={isActive}
                className="history-category-card"
                data-active={isActive || undefined}
                disabled={isLoading}
                key={label}
                onClick={() => onSelect(isActive ? "" : label)}
                type="button"
              >
                <FolderShape />
                <span
                  aria-hidden="true"
                  className="history-category-count"
                  title={
                    categoryCountsStatus === "ready"
                      ? `${count ?? 0} registros no período e filtros atuais`
                      : undefined
                  }
                >
                  {categoryCountsStatus === "loading" ? "…" : (count ?? "—")}
                </span>
                <Icon name={featuredCategoryIcons[label]} size={26} />
                <span>{label}</span>
              </button>
            );
          })}

          <button
            aria-pressed={isAdditionalCategory}
            className="history-category-card"
            data-active={isAdditionalCategory || undefined}
            disabled={isLoading}
            onClick={onShowMore}
            type="button"
          >
            <FolderShape />
            <Icon name="ellipsis" size={27} />
            <span>Mais categorias</span>
          </button>
        </div>
      </div>
    </section>
  );
}
