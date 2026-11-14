import { useEffect, useState } from "react";
import { ActionFeedback } from "../../components/ui/ActionFeedback";
import { Button } from "../../components/ui/Button";
import { SelectField } from "../../components/ui/SelectField";
import { useAuthenticatedSession } from "../authentication";
import type { AccessRecord } from "../access-records/types";
import { useCorrectionIntentStore } from "./correctionIntentContext";
import { CorrectionRequestDialog } from "./CorrectionRequestDialog";
import {
  correctionStatuses,
  type CorrectionPage,
  type CorrectionRequest,
  type CorrectionStatus,
} from "./schemas";
import { searchCorrectionRequests } from "./service";
import { correctionReadError } from "./useCorrectionSubmission";

export function CorrectionQueue({
  onResume,
  onApproved,
}: {
  onResume: (record: AccessRecord, trigger: HTMLButtonElement) => void;
  onApproved: (request: CorrectionRequest) => void;
}) {
  const { user } = useAuthenticatedSession();
  const { snapshot } = useCorrectionIntentStore();
  const [open, setOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<CorrectionStatus | "">("");
  const [query, setQuery] = useState<{
    status: CorrectionStatus | "";
    page: number;
    revision: number;
  }>({ status: "", page: 1, revision: 0 });
  const [result, setResult] = useState<CorrectionPage | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [active, setActive] = useState<{
    request: CorrectionRequest;
    trigger: HTMLElement;
  } | null>(null);
  useEffect(() => {
    if (!open) return;
    let current = true;
    void searchCorrectionRequests(query.status, query.page)
      .then((page) => {
        if (!current) return;
        const last = Math.max(1, page.totalPages);
        if (query.page > last) {
          setQuery((value) => ({ ...value, page: last }));
          return;
        }
        setResult(page);
        setError(null);
        setStatus("ready");
      })
      .catch((failure: unknown) => {
        if (!current) return;
        setError(correctionReadError(failure));
        setStatus("error");
      });
    return () => {
      current = false;
    };
  }, [open, query]);
  function refresh() {
    setStatus("loading");
    setQuery((value) => ({ ...value, revision: value.revision + 1 }));
  }
  const unfinished = Object.values(snapshot.proposals).filter(
    (intent) => intent.phase !== "submitted",
  );
  return (
    <section
      className="institutional-catalog my-5 rounded-2xl border border-border bg-surface p-4 sm:p-6"
      aria-labelledby="correction-queue-title"
    >
      <h2 id="correction-queue-title" className="text-xl font-bold text-text">
        Pedidos de correção
      </h2>
      <p className="my-3 text-sm text-text-muted">
        Consulte seus pedidos. Transporte e Administrador também conferem a fila
        autorizada, sem autoaprovação.
      </p>
      <ActionFeedback
        message={notice}
        tone="success"
        floating
        focusOnChange
        onDismiss={() => setNotice(null)}
      />
      {unfinished.length > 0 && (
        <div
          className="mb-4 space-y-2"
          aria-label="Rascunhos e envios em conferência nesta sessão"
        >
          {unfinished.map((intent) => (
            <div
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm text-text"
              key={intent.record.id}
            >
              <span>
                Registro #{intent.record.id}:{" "}
                {intent.phase === "draft"
                  ? "rascunho"
                  : "envio aguardando conferência"}
              </span>
              <Button
                variant="secondary"
                onClick={(event) =>
                  onResume(intent.record, event.currentTarget)
                }
              >
                Retomar pedido do registro #{intent.record.id}
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        variant="secondary"
        aria-expanded={open}
        aria-controls="correction-queue-results"
        onClick={() => {
          setOpen(!open);
          if (!open) setStatus("loading");
        }}
      >
        {open ? "Recolher pedidos" : "Consultar pedidos"}
      </Button>
      {open && (
        <div
          id="correction-queue-results"
          className="mt-4"
          aria-busy={status === "loading"}
        >
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setStatus("loading");
              setQuery((value) => ({
                status: draftStatus,
                page: 1,
                revision: value.revision + 1,
              }));
            }}
          >
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="correction-status"
                className="block font-semibold text-text"
              >
                Estado do pedido
              </label>
              <SelectField
                id="correction-status"
                value={draftStatus || "all"}
                options={[
                  { label: "Todos", value: "all" },
                  ...correctionStatuses.map((value) => ({
                    label: value,
                    value,
                  })),
                ]}
                onValueChange={(value) =>
                  setDraftStatus(
                    value === "all" ? "" : (value as CorrectionStatus),
                  )
                }
              />
            </div>
            <Button type="submit">Aplicar filtro de pedidos</Button>
            <Button variant="secondary" onClick={refresh}>
              Atualizar pedidos
            </Button>
          </form>
          {status === "loading" && (
            <p className="mt-4 text-text" role="status">
              Consultando pedidos…
            </p>
          )}
          {status === "error" && (
            <ActionFeedback message={error} tone="error" focusOnChange />
          )}
          {status === "ready" && result && (
            <>
              <p className="mt-4 text-sm text-text" role="status">
                {result.totalCount} pedido(s). Página {result.page} de{" "}
                {Math.max(1, result.totalPages)}.
              </p>
              {result.items.length === 0 ? (
                <p className="my-4 text-text">
                  Nenhum pedido encontrado neste filtro.
                </p>
              ) : (
                <ul className="my-4 space-y-3">
                  {result.items.map((request) => (
                    <li
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 text-text"
                    >
                      <div className="min-w-0 [overflow-wrap:anywhere]">
                        <p className="font-semibold">
                          Solicitação #{request.id} · {request.status}
                        </p>
                        <p className="text-sm">
                          Registro #{request.accessRecordId} ·{" "}
                          {request.driverName}
                        </p>
                        <p className="text-sm">
                          {request.plate
                            ? `Placa: ${request.plate}`
                            : `Identificação do veículo: ${request.vehicleIdentification || "não informada"}`}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={(event) =>
                          setActive({ request, trigger: event.currentTarget })
                        }
                      >
                        Conferir solicitação #{request.id}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  disabled={result.page <= 1}
                  onClick={() => {
                    setStatus("loading");
                    setQuery((value) => ({ ...value, page: value.page - 1 }));
                  }}
                >
                  Anterior nos pedidos
                </Button>
                <Button
                  variant="secondary"
                  disabled={result.page >= result.totalPages}
                  onClick={() => {
                    setStatus("loading");
                    setQuery((value) => ({ ...value, page: value.page + 1 }));
                  }}
                >
                  Próxima nos pedidos
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      {active && (
        <CorrectionRequestDialog
          request={active.request}
          userId={user.id}
          profileName={user.profileName}
          returnFocusTo={active.trigger}
          onClose={() => setActive(null)}
          onUpdated={(request) => {
            setActive((current) =>
              current?.request.id === request.id ? null : current,
            );
            refresh();
            if (request.status === "Aprovada") onApproved(request);
            else
              setNotice(
                `Solicitação #${request.id}: ${request.status}. O registro efetivo foi preservado.`,
              );
          }}
        />
      )}
    </section>
  );
}
