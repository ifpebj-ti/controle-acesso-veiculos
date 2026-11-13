import { useEffect, useId, useRef, useState } from "react";
import { ActionFeedback } from "../../../components/ui/ActionFeedback";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { PageHeader } from "../../../components/ui/PageHeader";
import { TextField } from "../../../components/ui/TextField";
import type {
  PreregistrationCatalogStatus,
  PreregistrationDraft,
  PreregistrationListItem,
  PreregistrationSearchDraft,
} from "../model/preregistrationPresentation";
import { PreregistrationCatalog } from "./PreregistrationCatalog";
import { PreregistrationForm } from "./PreregistrationForm";
interface Props {
  items: readonly PreregistrationListItem[];
  notice?: string | null;
  onCreate: (draft: PreregistrationDraft) => Promise<boolean>;
  onSearch: (filters: PreregistrationSearchDraft) => void;
  onRetry: () => void;
  status: PreregistrationCatalogStatus;
  readError?: string | null;
  mutationError?: string | null;
  fieldErrors?: Record<string, string>;
  possibleDuplicate?: boolean;
  uncertain?: boolean;
  pending?: boolean;
  onEdit?: () => void;
  onAddVehicle?: (person: PreregistrationListItem) => void;
  onDeactivate?: (person: PreregistrationListItem) => void;
  page?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}
export function PreregistrationView({
  items,
  notice,
  onCreate,
  onSearch,
  onRetry,
  status,
  readError,
  mutationError,
  fieldErrors,
  possibleDuplicate,
  uncertain,
  pending,
  onEdit,
  onAddVehicle,
  onDeactivate,
  page = 1,
  totalCount,
  onPageChange,
}: Props) {
  const id = useId(),
    trigger = useRef<HTMLButtonElement>(null),
    wasOpen = useRef(false),
    noticeRef = useRef<HTMLDivElement>(null);
  const [formOpen, setFormOpen] = useState(false),
    [filters, setFilters] = useState<PreregistrationSearchDraft>({
      query: "",
      includeInactive: false,
    });
  useEffect(() => {
    if (wasOpen.current && !formOpen) trigger.current?.focus();
    wasOpen.current = formOpen;
  }, [formOpen]);
  useEffect(() => {
    if (notice) noticeRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [notice]);
  const pages = Math.max(1, Math.ceil((totalCount ?? items.length) / 25));
  return (
    <div className="min-w-0">
      <PageHeader
        action={
          status !== "denied" ? (
            <Button
              disabled={formOpen || pending || uncertain}
              onClick={() => {
                onEdit?.();
                setFormOpen(true);
              }}
              ref={trigger}
            >
              <Icon name="plus" size={18} />
              Novo pré-cadastro
            </Button>
          ) : undefined
        }
        description="Cadastre condutores vinculados ao campus e associe seus veículos para agilizar o atendimento."
        eyebrow="Organização e atendimento"
        title="Pré-cadastro de condutores"
        variant="prominent"
      />
      {status === "denied" ? (
        <div className="mt-6">
          <PreregistrationCatalog
            items={[]}
            onRetry={onRetry}
            status={status}
          />
        </div>
      ) : (
        <>
          {formOpen && (
            <PreregistrationForm
              onCancel={() => setFormOpen(false)}
              onEdit={onEdit}
              onSubmit={async (draft) => {
                const success = await onCreate(draft);
                if (success) setFormOpen(false);
                return success;
              }}
              possibleDuplicate={possibleDuplicate}
              serverErrors={fieldErrors}
              serverMessage={mutationError}
              uncertain={uncertain}
            />
          )}
          <div className="mt-5" ref={noticeRef}>
            <ActionFeedback
              focusOnChange={!formOpen}
              message={notice}
              tone="success"
            />
            {!formOpen && (
              <ActionFeedback
                focusOnChange
                message={mutationError}
                tone="error"
              />
            )}
          </div>
          {uncertain && (
            <div className="mt-4 rounded-xl border border-border bg-surface-subtle p-4 text-sm leading-6 text-text">
              <p>
                O resultado continua incerto. A consulta não repete o envio;
                ausência momentânea na lista não prova que ele falhou. Confira o
                cadastro com o responsável antes de iniciar outra operação.
              </p>
              <Button
                className="mt-3"
                disabled={status === "loading"}
                onClick={onRetry}
                variant="secondary"
              >
                Consultar resultado sem reenviar
              </Button>
            </div>
          )}
          <section
            aria-labelledby={`${id}-search-title`}
            className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface text-text"
          >
            <div className="border-b border-border bg-surface-subtle p-5 sm:p-6">
              <h2 className="text-xl font-semibold" id={`${id}-search-title`}>
                Encontre um pré-cadastro
              </h2>
              <form
                className="mt-5 flex flex-wrap items-end gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (status !== "loading")
                    onSearch({ ...filters, query: filters.query.trim() });
                }}
              >
                <div className="min-w-0 flex-1 basis-72">
                  <label
                    className="block text-sm font-semibold"
                    htmlFor={`${id}-query`}
                  >
                    Nome ou placa
                  </label>
                  <TextField
                    autoComplete="off"
                    className="mt-2 w-full"
                    id={`${id}-query`}
                    maxLength={80}
                    onChange={(event) =>
                      setFilters({ ...filters, query: event.target.value })
                    }
                    type="search"
                    value={filters.query}
                  />
                </div>
                <label className="flex min-h-12 items-center gap-3 text-sm">
                  <input
                    checked={filters.includeInactive}
                    className="size-5 accent-primary"
                    onChange={(event) =>
                      setFilters({
                        ...filters,
                        includeInactive: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  Incluir inativos
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={status === "loading"} type="submit">
                    <Icon name="search" size={18} />
                    Aplicar filtros
                  </Button>
                  <Button
                    disabled={status === "loading"}
                    onClick={() => {
                      const empty = { query: "", includeInactive: false };
                      setFilters(empty);
                      onSearch(empty);
                    }}
                    variant="secondary"
                  >
                    Limpar filtros
                  </Button>
                </div>
              </form>
            </div>
            <div className="p-5 sm:p-6">
              <PreregistrationCatalog
                errorMessage={readError}
                items={items}
                locked={pending || uncertain || formOpen}
                onAddVehicle={onAddVehicle}
                onDeactivate={onDeactivate}
                onRetry={onRetry}
                status={status}
              />
            </div>
            {status === "ready" && onPageChange && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
                <p className="text-sm text-text-muted">
                  Página {page} de {pages} · {totalCount} vínculo(s)
                </p>
                <div className="flex gap-3">
                  <Button
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    variant="secondary"
                  >
                    Anterior
                  </Button>
                  <Button
                    disabled={page >= pages}
                    onClick={() => onPageChange(page + 1)}
                    variant="secondary"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
