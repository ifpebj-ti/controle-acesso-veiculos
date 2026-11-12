import { useEffect, useId, useRef, useState } from "react";

import { ActionFeedback } from "../../../components/ui/ActionFeedback";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import {
  preregistrationClassifications,
  type PreregistrationCatalogStatus,
  type PreregistrationDraft,
  type PreregistrationListItem,
  type PreregistrationSearchDraft,
} from "../model/preregistrationPresentation";
import { PreregistrationCatalog } from "./PreregistrationCatalog";
import { PreregistrationForm } from "./PreregistrationForm";

interface PreregistrationViewProps {
  items: readonly PreregistrationListItem[];
  notice?: string | null;
  onCreate: (draft: PreregistrationDraft) => Promise<void>;
  onSearch: (filters: PreregistrationSearchDraft) => void;
  onRetry: () => void;
  status: PreregistrationCatalogStatus;
}

/** Unmounted presentation candidate: no route, API, storage or permission rule. */
export function PreregistrationView({
  items,
  notice,
  onCreate,
  onSearch,
  onRetry,
  status,
}: PreregistrationViewProps) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState<PreregistrationSearchDraft>({
    name: "",
    classification: "",
  });
  useEffect(() => {
    if (wasOpen.current && !formOpen) trigger.current?.focus();
    wasOpen.current = formOpen;
  }, [formOpen]);
  return (
    <div className="min-w-0">
      <p className="mb-5 rounded-xl border border-border bg-surface-subtle p-4 text-sm text-text">
        Prévia de interface #689 — sem conexão com o cadastro. Use somente dados
        fictícios.
      </p>
      <PageHeader
        action={
          status !== "denied" ? (
            <Button
              disabled={formOpen}
              onClick={() => setFormOpen(true)}
              ref={trigger}
            >
              <Icon name="plus" size={18} />
              Novo pré-cadastro
            </Button>
          ) : undefined
        }
        description="Prepare os dados de alunos e funcionários para agilizar o atendimento."
        eyebrow="Organização e atendimento"
        title="Pré-cadastro de pessoas"
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
              onSubmit={async (draft) => {
                await onCreate(draft);
                setFormOpen(false);
              }}
            />
          )}
          <ActionFeedback className="mt-5" message={notice} tone="success" />
          <section
            aria-labelledby={`${id}-search-title`}
            className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface text-text"
          >
            <div className="border-b border-border bg-surface-subtle p-5 sm:p-6">
              <h2 className="text-xl font-semibold" id={`${id}-search-title`}>
                Encontre um pré-cadastro
              </h2>
              <form
                className="mt-5 grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (status !== "loading")
                    onSearch({ ...filters, name: filters.name.trim() });
                }}
              >
                <div className="min-w-0">
                  <label
                    className="block text-sm font-semibold"
                    htmlFor={`${id}-query`}
                  >
                    Nome completo
                  </label>
                  <TextField
                    autoComplete="off"
                    className="mt-2 w-full"
                    id={`${id}-query`}
                    onChange={(event) =>
                      setFilters({ ...filters, name: event.target.value })
                    }
                    type="search"
                    value={filters.name}
                  />
                </div>
                <div className="min-w-0">
                  <label
                    className="block text-sm font-semibold"
                    htmlFor={`${id}-filter`}
                  >
                    Classificação
                  </label>
                  <SelectField
                    className="mt-2 w-full"
                    id={`${id}-filter`}
                    onValueChange={(classification) =>
                      setFilters({ ...filters, classification })
                    }
                    options={[
                      { label: "Todas", value: "" },
                      ...preregistrationClassifications.map((value) => ({
                        label: value,
                        value,
                      })),
                    ]}
                    value={filters.classification}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={status === "loading"} type="submit">
                    <Icon name="search" size={18} />
                    Aplicar filtros
                  </Button>
                  <Button
                    disabled={status === "loading"}
                    onClick={() => {
                      const empty = { name: "", classification: "" };
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
                items={items}
                onRetry={onRetry}
                status={status}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
