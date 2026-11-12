import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { ActionFeedback } from "../../../components/ui/ActionFeedback";
import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import {
  preregistrationClassifications,
  type PreregistrationClassification,
  type PreregistrationDraft,
} from "../model/preregistrationPresentation";

interface PreregistrationFormProps {
  onCancel: () => void;
  onSubmit: (draft: PreregistrationDraft) => Promise<void>;
}

export function PreregistrationForm({
  onCancel,
  onSubmit,
}: PreregistrationFormProps) {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const [name, setName] = useState("");
  const [classification, setClassification] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    classification?: string;
  }>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);
  useEffect(() => {
    if (failed) feedbackRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [failed]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const nextErrors = {
      name: name.trim() ? undefined : "Informe o nome completo.",
      classification: preregistrationClassifications.includes(
        classification as PreregistrationClassification,
      )
        ? undefined
        : "Selecione a classificação.",
    };
    setErrors(nextErrors);
    setFailed(false);
    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.classification) {
      document.getElementById(`${id}-classification`)?.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        classification: classification as PreregistrationClassification,
      });
    } catch {
      // The future integration layer owns HTTP classification and reconciliation.
      setFailed(true);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface text-text"
    >
      <div className="border-b border-border bg-surface-subtle p-5 sm:p-6">
        <h2 className="text-xl font-semibold" id={`${id}-title`}>
          Novo pré-cadastro
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Informe somente o nome e a classificação. Veículo será tratado em
          outra etapa.
        </p>
      </div>
      <form
        aria-busy={busy}
        className="p-5 sm:p-6"
        noValidate
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <fieldset disabled={busy} className="grid min-w-0 gap-5 md:grid-cols-2">
          <legend className="sr-only">Dados da pessoa</legend>
          <div className="min-w-0">
            <label
              className="block text-sm font-semibold"
              htmlFor={`${id}-name`}
            >
              Nome completo
            </label>
            <TextField
              aria-describedby={errors.name ? `${id}-name-error` : undefined}
              aria-invalid={Boolean(errors.name)}
              autoComplete="off"
              className="mt-2 w-full"
              id={`${id}-name`}
              maxLength={200}
              name="name"
              ref={nameRef}
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
            />
            {errors.name && (
              <p
                className="mt-2 text-sm text-danger-text"
                id={`${id}-name-error`}
                role="alert"
              >
                {errors.name}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <label
              className="block text-sm font-semibold"
              htmlFor={`${id}-classification`}
            >
              Classificação
            </label>
            <SelectField
              aria-describedby={
                errors.classification ? `${id}-classification-error` : undefined
              }
              aria-invalid={Boolean(errors.classification)}
              className="mt-2 w-full"
              disabled={busy}
              id={`${id}-classification`}
              onValueChange={(value) => {
                setClassification(value);
                setErrors((current) => ({
                  ...current,
                  classification: undefined,
                }));
              }}
              options={preregistrationClassifications.map((value) => ({
                label: value,
                value,
              }))}
              placeholder="Selecione a classificação"
              required
              value={classification}
            />
            {errors.classification && (
              <p
                className="mt-2 text-sm text-danger-text"
                id={`${id}-classification-error`}
                role="alert"
              >
                {errors.classification}
              </p>
            )}
          </div>
        </fieldset>
        <div className="mt-5" ref={feedbackRef}>
          <ActionFeedback
            message={
              failed
                ? "Não foi possível concluir o pré-cadastro. Os campos foram mantidos."
                : null
            }
            tone="error"
          />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <Button disabled={busy} onClick={onCancel} variant="secondary">
            Cancelar
          </Button>
          <Button disabled={busy} type="submit">
            {busy ? "Enviando…" : "Pré-cadastrar"}
          </Button>
        </div>
      </form>
    </section>
  );
}
