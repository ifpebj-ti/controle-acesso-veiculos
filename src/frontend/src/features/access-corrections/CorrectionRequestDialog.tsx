import { useState } from "react";
import { CorrectionFeedback } from "./CorrectionFeedback";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/TextField";
import type { ProfileName } from "../authentication";
import { CorrectionComparison } from "./CorrectionComparison";
import { CorrectionDialog } from "./CorrectionDialog";
import { useCorrectionDecision } from "./useCorrectionDecision";
import type { CorrectionAction, CorrectionRequest } from "./schemas";

const actionLabels: Record<CorrectionAction, string> = {
  Approve: "Aprovar",
  Reject: "Rejeitar",
  Cancel: "Cancelar pedido",
};
const format = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
export function CorrectionRequestDialog({
  request: initial,
  userId,
  profileName,
  onClose,
  onUpdated,
  returnFocusTo,
}: {
  request: CorrectionRequest;
  userId: number;
  profileName: ProfileName;
  onClose: () => void;
  onUpdated: (request: CorrectionRequest) => void;
  returnFocusTo: HTMLElement | null;
}) {
  const [request, setRequest] = useState(initial);
  const decision = useCorrectionDecision();
  const intent = decision.snapshot.decisions[request.id];
  const own = request.requestedByUserId === userId;
  const reviewer =
    profileName === "Administrador" || profileName === "SetorTransporte";
  const pending = request.status === "Pendente";
  async function perform(readOnly: boolean) {
    const result = readOnly
      ? await decision.reconcile(request.id)
      : await decision.confirm(request.id);
    if (result) {
      setRequest(result);
      onUpdated(result);
    }
  }
  return (
    <CorrectionDialog
      title={`Solicitação #${request.id}`}
      onClose={onClose}
      returnFocusTo={returnFocusTo}
    >
      <p className="mt-4 text-text">
        Registro #{request.accessRecordId} · {request.driverName}
      </p>
      <dl className="mt-3 grid gap-3 text-sm text-text sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Placa</dt>
          <dd>{request.plate || "Sem placa informada"}</dd>
        </div>
        <div>
          <dt className="font-semibold">Identificação do veículo</dt>
          <dd>{request.vehicleIdentification || "Não informada"}</dd>
        </div>
        <div>
          <dt className="font-semibold">Estado do pedido</dt>
          <dd>{request.status}</dd>
        </div>
        <div>
          <dt className="font-semibold">Solicitado por</dt>
          <dd>
            Usuário #{request.requestedByUserId} ·{" "}
            {format(request.requestedAtUtc)}
          </dd>
        </div>
      </dl>
      <CorrectionComparison
        original={request.original}
        proposed={request.proposed}
      />
      <p className="whitespace-pre-wrap break-words text-sm text-text">
        <strong>Motivo do pedido: </strong>
        {request.justification}
      </p>
      {request.decidedByUserId !== null && (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-text">
          <strong>Decisão: </strong>
          {request.status} · Usuário #{request.decidedByUserId} ·{" "}
          {format(request.decidedAtUtc!)}
          <br />
          {request.decisionReason}
        </p>
      )}
      {pending && (
        <p className="mt-4 text-sm text-text-muted">
          O pedido não bloqueia a saída normal. Somente aprovação modifica o
          acesso. O servidor confere escopo, autoria e conflitos.
        </p>
      )}
      {pending && (!intent || intent.phase === "draft") && (
        <div className="mt-4 flex flex-wrap gap-3">
          {own ? (
            <Button
              variant="secondary"
              onClick={() => decision.prepare(request.id, "Cancel")}
            >
              Cancelar pedido
            </Button>
          ) : reviewer ? (
            <>
              <Button onClick={() => decision.prepare(request.id, "Approve")}>
                Aprovar
              </Button>
              <Button
                variant="secondary"
                onClick={() => decision.prepare(request.id, "Reject")}
              >
                Rejeitar
              </Button>
            </>
          ) : null}
        </div>
      )}
      {pending && intent && (
        <form
          className="mt-4 space-y-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void perform(false);
          }}
        >
          <label
            htmlFor="review-justification"
            className="block font-semibold text-text"
          >
            Motivo — {actionLabels[intent.action]}
          </label>
          <TextArea
            id="review-justification"
            value={intent.reason}
            disabled={intent.phase !== "draft"}
            maxLength={500}
            aria-describedby="review-reason-help"
            onChange={(event) =>
              decision.setReason(request.id, event.target.value)
            }
          />
          <p id="review-reason-help" className="text-sm text-text-muted">
            Informe de 10 a 500 caracteres. Após envio incerto, a conferência é
            somente por consulta.
          </p>
          <CorrectionFeedback message={intent.error} tone="error" />
          {intent.phase === "draft" ? (
            <Button type="submit">
              Confirmar {actionLabels[intent.action].toLocaleLowerCase("pt-BR")}
            </Button>
          ) : (
            <Button
              disabled={intent.reading || intent.phase === "blocked"}
              onClick={() => void perform(true)}
            >
              {intent.reading
                ? "Consultando pedido…"
                : "Consultar resultado da decisão"}
            </Button>
          )}
        </form>
      )}
      {!pending && (
        <CorrectionFeedback
          message={`Estado confirmado pela consulta ou resposta da API: ${request.status}.`}
          tone="success"
        />
      )}
      <div className="mt-5 border-t border-border pt-4">
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </CorrectionDialog>
  );
}
