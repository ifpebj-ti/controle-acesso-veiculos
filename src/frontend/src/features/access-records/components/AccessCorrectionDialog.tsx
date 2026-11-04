import { useEffect, useState, type FormEvent } from "react";
import { CorrectionFeedback } from "../../access-corrections/CorrectionFeedback";
import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextArea } from "../../../components/ui/TextField";
import { CorrectionReviewScope } from "../../access-corrections/CorrectionReviewScope";
import { CorrectionDialog } from "../../access-corrections/CorrectionDialog";
import { CorrectionComparison } from "../../access-corrections/CorrectionComparison";
import { useCorrectionSubmission } from "../../access-corrections/useCorrectionSubmission";
import type { CorrectionRequest } from "../../access-corrections/schemas";
import { generalAccessCategories } from "../model/accessCategories";
import {
  accessCorrectionFormSchema,
  type AccessCorrectionFormValues,
} from "../schemas/accessRecordSchemas";
import type { AccessRecord } from "../types";

interface Props {
  onClose: () => void;
  onRequested: (request: CorrectionRequest) => void;
  onReload: () => void;
  record: AccessRecord;
  returnFocusTo: HTMLElement | null;
}
function ProposalDialog({
  onClose,
  onRequested,
  onReload,
  record,
  returnFocusTo,
}: Props) {
  const submission = useCorrectionSubmission();
  const { store } = submission;
  const intent = submission.snapshot.proposals[record.id];
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    store.begin(record);
  }, [store, record]);
  if (!intent) return null;
  const values = intent.draft;
  const locked = intent.phase !== "draft";
  const original = {
    categoryName: intent.record.categoryName,
    objective: intent.record.objective,
    observation: intent.record.observation,
  };
  const proposed = {
    categoryName: values.categoryName,
    objective: values.objective,
    observation: values.observation || null,
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = accessCorrectionFormSchema.safeParse(values);
    if (!parsed.success) {
      const next = Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
      setErrors(next);
      const firstInvalid = [
        "objective",
        "categoryName",
        "observation",
        "justification",
      ].find((field) => next[field]);
      requestAnimationFrame(() =>
        document
          .getElementById(
            `correction-${firstInvalid === "categoryName" ? "category" : firstInvalid}`,
          )
          ?.focus(),
      );
      return;
    }
    setErrors({});
    const request = await submission.submit(record.id);
    if (request) onRequested(request);
  }
  async function reconcile() {
    const request = await submission.reconcile(record.id);
    if (request) onRequested(request);
  }
  function update(field: keyof AccessCorrectionFormValues, value: string) {
    submission.updateDraft(record.id, field, value);
    setErrors((current) => ({ ...current, [field]: "" }));
  }
  return (
    <CorrectionDialog
      title="Solicitar correção"
      onClose={onClose}
      returnFocusTo={returnFocusTo}
    >
      <p className="mt-4 text-sm text-text-muted">
        Registro #{record.id} · {record.plate} · {record.driverName}
      </p>
      <p className="mt-3 rounded-xl border border-border bg-surface-subtle p-4 text-sm text-text">
        O envio cria um pedido pendente. Somente a aprovação altera o registro.
        A saída normal continua disponível. Você pode fechar esta janela e
        continuar a operação. Rascunhos serão perdidos ao recarregar a página ou
        sair da conta; confira os envios incertos antes disso.
      </p>
      {intent.request && (
        <p role="status" className="mt-4 font-semibold text-text">
          Solicitação #{intent.request.id}: {intent.request.status}.
        </p>
      )}
      <CorrectionComparison original={original} proposed={proposed} />
      <form
        onSubmit={(event) => void submit(event)}
        className="space-y-4"
        noValidate
      >
        <div>
          <label
            htmlFor="correction-objective"
            className="font-semibold text-text"
          >
            Objetivo
          </label>
          <TextArea
            id="correction-objective"
            className="mt-2"
            maxLength={500}
            disabled={locked}
            value={values.objective}
            onChange={(event) => update("objective", event.target.value)}
            aria-invalid={!!errors.objective}
            aria-describedby="correction-objective-error"
          />
          <p
            id="correction-objective-error"
            className="text-sm text-danger-text"
          >
            {errors.objective}
          </p>
        </div>
        <div>
          <label
            htmlFor="correction-category"
            className="font-semibold text-text"
          >
            Categoria
          </label>
          <SelectField
            id="correction-category"
            disabled={locked}
            value={values.categoryName}
            onValueChange={(value) => update("categoryName", value)}
            options={generalAccessCategories.map((value) => ({
              label: value,
              value,
            }))}
            aria-invalid={!!errors.categoryName}
            aria-describedby="correction-category-error"
          />
          <p
            id="correction-category-error"
            className="text-sm text-danger-text"
          >
            {errors.categoryName}
          </p>
        </div>
        <div>
          <label
            htmlFor="correction-observation"
            className="font-semibold text-text"
          >
            Observação (opcional)
          </label>
          <TextArea
            id="correction-observation"
            maxLength={1000}
            disabled={locked}
            value={values.observation}
            onChange={(event) => update("observation", event.target.value)}
            aria-invalid={!!errors.observation}
            aria-describedby="correction-observation-error"
          />
          <p
            id="correction-observation-error"
            className="text-sm text-danger-text"
          >
            {errors.observation}
          </p>
        </div>
        <div>
          <label
            htmlFor="correction-justification"
            className="font-semibold text-text"
          >
            Justificativa da correção
          </label>
          <TextArea
            id="correction-justification"
            maxLength={500}
            disabled={locked}
            value={values.justification}
            onChange={(event) => update("justification", event.target.value)}
            aria-invalid={!!errors.justification}
            aria-describedby="correction-justification-help correction-justification-error"
          />
          <p
            id="correction-justification-help"
            className="text-sm text-text-muted"
          >
            Informe de 10 a 500 caracteres.
          </p>
          <p
            id="correction-justification-error"
            className="text-sm text-danger-text"
          >
            {errors.justification}
          </p>
        </div>
        <CorrectionFeedback message={intent.error} tone="error" />
        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          {intent.phase === "draft" ? (
            <Button type="submit">Enviar solicitação</Button>
          ) : (
            <Button
              disabled={intent.reading || intent.phase === "blocked"}
              onClick={() => void reconcile()}
            >
              {intent.reading ? "Consultando envio…" : "Consultar envio"}
            </Button>
          )}
          {(intent.rejectedAndAbsent ||
            (intent.request && intent.request.status !== "Pendente")) && (
            <Button
              variant="secondary"
              onClick={() => {
                store.removeProposal(record.id);
                onClose();
                onReload();
              }}
            >
              Encerrar esta intenção e atualizar registros
            </Button>
          )}
        </div>
      </form>
    </CorrectionDialog>
  );
}
export function AccessCorrectionDialog(props: Props) {
  return (
    <CorrectionReviewScope>
      <ProposalDialog {...props} />
    </CorrectionReviewScope>
  );
}
