import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { Button } from "../components/ui/Button";
import { ContentState } from "../components/ui/ContentState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { SelectField } from "../components/ui/SelectField";
import { TextField } from "../components/ui/TextField";
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
          <Link className="ui-button ui-button--primary" to="/acessos/novo">
            <Icon name="plus" size={18} /> Nova entrada
          </Link>
        }
        description="Localize veículos que ainda não registraram saída e encerre o acesso após a conferência manual."
        eyebrow="Operação da portaria"
        title="Acessos em aberto"
        variant="prominent"
      />

      {notice && (
        <div
          className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-success-border bg-success-surface p-4 text-sm text-success-text"
          role="status"
        >
          <p>{notice}</p>
          <button
            className="shrink-0 rounded-md font-bold underline underline-offset-4 focus:outline-3 focus:outline-offset-2 focus:outline-focus"
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
            <Button
              disabled={
                accessRecords.isRefreshing || accessRecords.closingId !== null
              }
              onClick={() => void accessRecords.refresh()}
              type="button"
              variant="secondary"
            >
              Tentar novamente
            </Button>
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
        aria-labelledby="open-access-list-title"
        className="institutional-catalog mt-6 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-sm"
      >
        <div className="p-4 sm:p-6">
          <div className="open-access-section-heading flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-xl rounded-bl-md bg-success-surface text-primary"
            >
              <Icon name="car" size={23} />
            </span>
            <div className="min-w-0">
              <h2
                className="text-lg font-bold text-text"
                id="open-access-list-title"
              >
                Veículos aguardando saída
              </h2>
              <p className="mt-0.5 text-sm text-text-muted">
                Pesquise, confira os dados e escolha a ação adequada.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_auto_auto] lg:items-end">
            <div className="w-full">
              <label className="sr-only" htmlFor="open-search">
                Buscar acesso aberto
              </label>
              <div className="relative">
                <Icon
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-ink-soft"
                  name="search"
                  size={22}
                />
                <TextField
                  className="open-access-search-field min-h-13 rounded-xl"
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
              <>
                <div className="open-access-counter flex min-h-13 items-center gap-3 rounded-xl border border-success-border bg-success-surface px-4 py-2.5 text-sm text-success-text">
                  <Icon className="shrink-0" name="clock" size={26} />
                  <div>
                    <p aria-live="polite" className="font-bold text-ink">
                      {accessRecords.records.length} em aberto
                      {hasActiveFilters &&
                        ` · ${filteredRecords.length} exibido(s)`}
                    </p>
                    {accessRecords.lastUpdatedAt && (
                      <p className="mt-0.5 whitespace-nowrap text-xs text-ink-soft">
                        Última atualização:{" "}
                        {updateTimeFormatter.format(
                          accessRecords.lastUpdatedAt,
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  className="min-h-13 whitespace-nowrap rounded-xl px-5"
                  disabled={
                    accessRecords.isRefreshing ||
                    accessRecords.closingId !== null
                  }
                  onClick={() => void accessRecords.refresh()}
                  type="button"
                  variant="secondary"
                >
                  <Icon
                    className={accessRecords.isRefreshing ? "animate-spin" : ""}
                    name="refresh"
                    size={19}
                  />
                  {accessRecords.isRefreshing
                    ? "Atualizando…"
                    : "Atualizar lista"}
                </Button>
              </>
            )}
          </div>

          {accessRecords.status === "ready" &&
            availableCategories.length > 0 && (
              <div className="open-access-filter-strip mt-5 rounded-xl border border-border px-4 py-3">
                <div className="sm:hidden">
                  <label
                    className="text-sm font-semibold text-ink"
                    htmlFor="open-category-filter"
                  >
                    Categoria
                  </label>
                  <SelectField
                    className="mt-2"
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
                    <Button
                      aria-pressed={selectedCategory === null}
                      className="rounded-full"
                      onClick={() => setSelectedCategory(null)}
                      type="button"
                      variant={
                        selectedCategory === null ? "primary" : "secondary"
                      }
                    >
                      Todos
                    </Button>
                    {availableCategories.map((category) => {
                      const isSelected = selectedCategory === category;

                      return (
                        <Button
                          aria-pressed={isSelected}
                          className="rounded-full"
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          type="button"
                          variant={isSelected ? "primary" : "secondary"}
                        >
                          {category}
                        </Button>
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
