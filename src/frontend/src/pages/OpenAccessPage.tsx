import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import {
  AccessExitDialog,
  OpenAccessList,
  type AccessRecord,
  useOpenAccessRecords,
} from "../features/access-records";

interface LocationState {
  notice?: string;
}

interface ExitSelection {
  record: AccessRecord;
  trigger: HTMLButtonElement;
}

const updateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function OpenAccessPage() {
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [navigationNotice, setNavigationNotice] = useState(
    (location.state as LocationState | null)?.notice ?? null,
  );
  const [exitSelection, setExitSelection] = useState<ExitSelection | null>(
    null,
  );
  const accessRecords = useOpenAccessRecords();

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return accessRecords.records.filter((record) =>
      [
        record.plate,
        record.driverName,
        record.categoryName,
        record.objective,
      ].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
      ),
    );
  }, [accessRecords.records, query]);

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
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          <p>{accessRecords.queryError}</p>
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
        </div>
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50"
                  name="search"
                />
                <input
                  className="min-h-12 w-full rounded-xl border border-ink/20 bg-cream/45 pl-12 pr-4 text-ink outline-none placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20"
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
                <div className="text-sm text-ink/65">
                  <p aria-live="polite" className="font-bold text-ink">
                    {accessRecords.records.length} em aberto
                    {query.trim() && ` · ${filteredRecords.length} exibido(s)`}
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

          {accessRecords.isRefreshing && (
            <p className="mt-3 text-sm font-semibold text-ink/60" role="status">
              Atualizando a lista. Os dados anteriores continuam disponíveis.
            </p>
          )}

          {accessRecords.status === "loading" ? (
            <div
              className="my-10 rounded-2xl bg-cream/35 p-8 text-center"
              role="status"
            >
              Carregando acessos em aberto…
            </div>
          ) : accessRecords.status ===
            "error" ? null : filteredRecords.length === 0 ? (
            <div className="my-10 rounded-2xl border border-dashed border-ink/20 bg-cream/35 p-8 text-center">
              <p className="font-bold text-ink">
                Nenhum acesso aberto encontrado
              </p>
              <p className="mt-1 text-sm text-ink/60">
                {query.trim()
                  ? "Limpe ou ajuste a busca para ver outros acessos."
                  : "Registre uma nova entrada quando necessário."}
              </p>
            </div>
          ) : (
            <OpenAccessList
              closingId={accessRecords.closingId}
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
    </div>
  );
}
