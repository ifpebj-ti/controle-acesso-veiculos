import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { ContentState } from "../components/ui/ContentState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { SelectField } from "../components/ui/SelectField";
import {
  AccessExitDialog,
  ExceptionalClosureDialog,
  OpenAccessList,
  type AccessRecord,
  useOpenAccessRecords,
} from "../features/access-records";
import { useAuthenticatedSession } from "../features/authentication";
import { profileHasCapability } from "../routes/routeMetadata";

interface LocationState {
  notice?: string;
}

interface ExitSelection {
  record: AccessRecord;
  trigger: HTMLButtonElement;
}

interface ExceptionalSelection {
  record: AccessRecord;
  trigger: HTMLButtonElement;
}

const updateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function OpenAccessPage() {
  const { user } = useAuthenticatedSession();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [navigationNotice, setNavigationNotice] = useState(
    (location.state as LocationState | null)?.notice ?? null,
  );
  const [exitSelection, setExitSelection] = useState<ExitSelection | null>(
    null,
  );
  const [exceptionalSelection, setExceptionalSelection] =
    useState<ExceptionalSelection | null>(null);
  const accessRecords = useOpenAccessRecords();
  const canExceptionallyClose = profileHasCapability(
    user.profileName,
    "exceptionally-close-general-access",
  );

  const availableCategories = useMemo(
    () => [
      ...new Set(accessRecords.records.map((record) => record.categoryName)),
    ],
    [accessRecords.records],
  );
  const categoriesKey = JSON.stringify(availableCategories);
  const [previousCategoriesKey, setPreviousCategoriesKey] =
    useState(categoriesKey);

  if (previousCategoriesKey !== categoriesKey) {
    setPreviousCategoriesKey(categoriesKey);
    if (
      selectedCategory !== null &&
      !availableCategories.includes(selectedCategory)
    ) {
      setSelectedCategory(null);
    }
  }

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return accessRecords.records.filter(
      (record) =>
        (selectedCategory === null ||
          record.categoryName === selectedCategory) &&
        [
          record.plate,
          record.driverName,
          record.categoryName,
          record.objective,
        ].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
        ),
    );
  }, [accessRecords.records, query, selectedCategory]);

  const hasActiveFilters = query.trim() !== "" || selectedCategory !== null;

  const notice = accessRecords.notice ?? navigationNotice;

  function dismissNotice() {
    accessRecords.clearNotice();
    setNavigationNotice(null);
  }

  function openExitDialog(record: AccessRecord, trigger: HTMLButtonElement) {
    if (accessRecords.closingId !== null) return;
    accessRecords.clearOperationError();
    setExitSelection({ record, trigger });
  }

  function closeExitDialog() {
    if (accessRecords.closingId !== null) return;
    accessRecords.clearOperationError();
    setExitSelection(null);
  }

  async function confirmExit() {
    if (!exitSelection) return;
    const succeeded = await accessRecords.closeRecord(exitSelection.record);
    if (succeeded) setExitSelection(null);
  }

  function openExceptionalDialog(
    record: AccessRecord,
    trigger: HTMLButtonElement,
  ) {
    if (!canExceptionallyClose || accessRecords.closingId !== null) return;
    setExceptionalSelection({ record, trigger });
  }

  function closeExceptionalDialog() {
    if (accessRecords.closingId !== null) return;
    setExceptionalSelection(null);
  }

  if (accessRecords.status === "denied") {
    return (
      <AccessDeniedState message={accessRecords.queryError ?? undefined} />
    );
  }

  return (
    <div>
      <PageHeader
        action={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-dark px-5 text-sm font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            to="/acessos/novo"
          >
            <Icon name="plus" size={18} /> Nova entrada
          </Link>
        }
        description="Localize veículos que ainda não registraram saída e encerre o acesso após a conferência manual."
        eyebrow="Operação da portaria"
        title="Acessos em aberto"
      />

      {notice && (
        <div
          className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          role="status"
        >
          <p>{notice}</p>
          <button
            className="shrink-0 rounded-md font-bold underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            onClick={dismissNotice}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      {accessRecords.queryError && (
        <ContentState
          action={
            <button
              className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-700/30 disabled:cursor-wait disabled:opacity-60"
              disabled={
                accessRecords.isRefreshing || accessRecords.closingId !== null
              }
              onClick={() => void accessRecords.refresh()}
              type="button"
            >
              Tentar novamente
            </button>
          }
          className="mt-6"
          title={accessRecords.queryError}
          variant="error"
        />
      )}

      <section
        aria-busy={
          accessRecords.isRefreshing || accessRecords.status === "loading"
        }
        className="mt-6 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]"
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-xl">
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="open-search"
              >
                Buscar acesso aberto
              </label>
              <div className="relative mt-2">
                <Icon
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
                  name="search"
                />
                <input
                  className="min-h-12 w-full rounded-xl border border-ink/20 bg-cream/45 pl-12 pr-4 text-ink outline-none placeholder:text-ink-soft focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20"
                  id="open-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Placa, condutor, categoria ou objetivo"
                  ref={searchRef}
                  type="search"
                  value={query}
                />
              </div>
            </div>

            {accessRecords.status === "ready" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="text-sm text-ink-soft">
                  <p aria-live="polite" className="font-bold text-ink">
                    {accessRecords.records.length} em aberto
                    {hasActiveFilters &&
                      ` · ${filteredRecords.length} exibido(s)`}
                  </p>
                  {accessRecords.lastUpdatedAt && (
                    <p className="mt-0.5 text-xs">
                      Última atualização:{" "}
                      {updateTimeFormatter.format(accessRecords.lastUpdatedAt)}
                    </p>
                  )}
                </div>
                <button
                  className="min-h-11 rounded-xl border border-ink/15 px-4 text-sm font-bold text-ink hover:bg-cream/60 focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25 disabled:cursor-wait disabled:opacity-60"
                  disabled={
                    accessRecords.isRefreshing ||
                    accessRecords.closingId !== null
                  }
                  onClick={() => void accessRecords.refresh()}
                  type="button"
                >
                  {accessRecords.isRefreshing
                    ? "Atualizando…"
                    : "Atualizar lista"}
                </button>
              </div>
            )}
          </div>

          {accessRecords.status === "ready" &&
            availableCategories.length > 0 && (
              <div className="mt-5">
                <div className="sm:hidden">
                  <label
                    className="text-sm font-semibold text-ink"
                    htmlFor="open-category-filter"
                  >
                    Categoria
                  </label>
                  <SelectField
                    className="mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-white px-4 text-ink outline-none focus:border-brand-dark focus:ring-3 focus:ring-brand/20"
                    id="open-category-filter"
                    onValueChange={(value) =>
                      setSelectedCategory(value || null)
                    }
                    options={[
                      { label: "Todas as categorias", value: "" },
                      ...availableCategories.map((category) => ({
                        label: category,
                        value: category,
                      })),
                    ]}
                    value={selectedCategory ?? ""}
                  />
                </div>

                <fieldset className="hidden sm:block">
                  <legend className="text-sm font-semibold text-ink">
                    Filtrar por categoria
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      aria-pressed={selectedCategory === null}
                      className={`min-h-11 rounded-full border px-4 text-sm font-bold transition focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 ${
                        selectedCategory === null
                          ? "border-brand-dark bg-brand-dark text-white"
                          : "border-ink/15 bg-white text-ink hover:bg-cream/60"
                      }`}
                      onClick={() => setSelectedCategory(null)}
                      type="button"
                    >
                      Todos
                    </button>
                    {availableCategories.map((category) => {
                      const isSelected = selectedCategory === category;

                      return (
                        <button
                          aria-pressed={isSelected}
                          className={`min-h-11 rounded-full border px-4 text-sm font-bold transition focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 ${
                            isSelected
                              ? "border-brand-dark bg-brand-dark text-white"
                              : "border-ink/15 bg-white text-ink hover:bg-cream/60"
                          }`}
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          type="button"
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

          {accessRecords.isRefreshing && (
            <p
              className="mt-3 text-sm font-semibold text-ink-soft"
              role="status"
            >
              Atualizando a lista. Os dados anteriores continuam disponíveis.
            </p>
          )}

          {accessRecords.status === "loading" ? (
            <ContentState
              className="my-8"
              title="Carregando acessos em aberto…"
              variant="loading"
            />
          ) : accessRecords.status ===
            "error" ? null : filteredRecords.length === 0 ? (
            <ContentState
              className="my-8"
              description={
                hasActiveFilters
                  ? "Ajuste a busca ou escolha outra categoria para ver outros acessos."
                  : "Registre uma nova entrada quando necessário."
              }
              icon="car"
              title="Nenhum acesso aberto encontrado"
              variant="empty"
            />
          ) : (
            <OpenAccessList
              canExceptionallyClose={canExceptionallyClose}
              closingId={accessRecords.closingId}
              closingOperation={accessRecords.closingOperation}
              onExceptionalClosure={openExceptionalDialog}
              onExit={openExitDialog}
              records={filteredRecords}
            />
          )}
        </div>
      </section>

      {exitSelection && (
        <AccessExitDialog
          errorMessage={accessRecords.operationError}
          onCancel={closeExitDialog}
          onConfirm={() => void confirmExit()}
          pending={accessRecords.closingId === exitSelection.record.id}
          record={exitSelection.record}
          returnFocusTo={exitSelection.trigger}
          successFocusRef={searchRef}
        />
      )}

      {exceptionalSelection && (
        <ExceptionalClosureDialog
          onCancel={closeExceptionalDialog}
          onClosed={() => setExceptionalSelection(null)}
          onConfirm={(input) =>
            accessRecords.exceptionallyCloseRecord(
              exceptionalSelection.record,
              input,
            )
          }
          record={exceptionalSelection.record}
          returnFocusTo={exceptionalSelection.trigger}
          successFocusRef={searchRef}
        />
      )}
    </div>
  );
}
