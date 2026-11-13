import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ActionFeedback } from "../../../components/ui/ActionFeedback";
import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import {
  affiliationLabel,
  preregistrationClassifications,
  type PreregistrationClassification,
  type PreregistrationDraft,
} from "../model/preregistrationPresentation";
import { CampusVehicleFields } from "./CampusVehicleFields";
import {
  emptyVehicle,
  vehicleErrors,
  vehicleInput,
} from "../model/campusVehicleForm";
interface Props {
  onCancel: () => void;
  onSubmit: (draft: PreregistrationDraft) => Promise<boolean>;
  serverErrors?: Record<string, string>;
  serverMessage?: string | null;
  possibleDuplicate?: boolean;
  uncertain?: boolean;
  onEdit?: () => void;
}
export function PreregistrationForm({
  onCancel,
  onSubmit,
  serverErrors = {},
  serverMessage,
  possibleDuplicate = false,
  uncertain = false,
  onEdit,
}: Props) {
  const id = useId(),
    nameRef = useRef<HTMLInputElement>(null),
    formRef = useRef<HTMLFormElement>(null),
    feedbackRef = useRef<HTMLDivElement>(null),
    sending = useRef(false);
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [vehicle, setVehicle] = useState(emptyVehicle);
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const effectiveErrors = { ...serverErrors, ...errors };
  const locked = busy || uncertain;
  useEffect(() => {
    nameRef.current?.focus();
  }, []);
  useEffect(() => {
    if (failed || serverMessage)
      feedbackRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [failed, serverMessage]);
  function edited() {
    setErrors({});
    setFailed(false);
    setDuplicateConfirmed(false);
    onEdit?.();
  }
  function error(field: string) {
    return effectiveErrors[field] ? (
      <p
        className="mt-2 text-sm text-danger-text"
        id={`${id}-${field}-error`}
        role="alert"
      >
        {effectiveErrors[field]}
      </p>
    ) : null;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || uncertain) return;
    const next: Record<string, string> = { ...vehicleErrors(vehicle) };
    if (!name.trim()) next.name = "Informe o nome completo.";
    if (
      !preregistrationClassifications.includes(
        affiliation as PreregistrationClassification,
      )
    )
      next.affiliation = "Selecione o vínculo.";
    if (!birthDate) next.birthDate = "Informe a data de nascimento.";
    if (!confirmed)
      next.birthDateConfirmed = "Confirme a data de nascimento conferida.";
    if (possibleDuplicate && !duplicateConfirmed)
      next.confirmPossibleDuplicate =
        "Confira o cadastro existente e confirme que é outra pessoa.";
    setErrors(next);
    setFailed(false);
    if (Object.keys(next).length) {
      queueMicrotask(() => {
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        affiliation: affiliation as PreregistrationClassification,
        birthDate,
        birthDateConfirmed: confirmed,
        ...vehicleInput(vehicle),
        confirmPossibleDuplicate: possibleDuplicate && duplicateConfirmed,
      });
    } catch {
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
          Condutores de veículos automotores precisam ter 18 anos completos.
          Maioridade não comprova habilitação nem autoriza entrada.
        </p>
      </div>
      <form
        aria-busy={busy}
        className="p-5 sm:p-6"
        noValidate
        onSubmit={(event) => {
          void submit(event);
        }}
        ref={formRef}
      >
        <fieldset
          className="grid min-w-0 gap-5 md:grid-cols-2"
          disabled={locked}
        >
          <legend className="sr-only">Dados do condutor e veículo</legend>
          <div>
            <label
              className="block text-sm font-semibold"
              htmlFor={`${id}-name`}
            >
              Nome completo
            </label>
            <TextField
              aria-describedby={
                effectiveErrors.name ? `${id}-name-error` : undefined
              }
              aria-invalid={Boolean(effectiveErrors.name)}
              autoComplete="off"
              className="mt-2 w-full"
              id={`${id}-name`}
              maxLength={200}
              onChange={(event) => {
                setName(event.target.value);
                edited();
              }}
              ref={nameRef}
              required
              value={name}
            />
            {error("name")}
          </div>
          <div>
            <label
              className="block text-sm font-semibold"
              htmlFor={`${id}-affiliation`}
            >
              Vínculo
            </label>
            <SelectField
              aria-describedby={
                effectiveErrors.affiliation
                  ? `${id}-affiliation-error`
                  : undefined
              }
              aria-invalid={Boolean(effectiveErrors.affiliation)}
              className="mt-2 w-full"
              disabled={locked}
              id={`${id}-affiliation`}
              onValueChange={(value) => {
                setAffiliation(value);
                edited();
              }}
              options={preregistrationClassifications.map((value) => ({
                label: affiliationLabel(value),
                value,
              }))}
              placeholder="Selecione o vínculo"
              required
              value={affiliation}
            />
            {error("affiliation")}
          </div>
          <div>
            <label
              className="block text-sm font-semibold"
              htmlFor={`${id}-birthDate`}
            >
              Data de nascimento
            </label>
            <TextField
              aria-describedby={`${id}-birth-hint${effectiveErrors.birthDate ? ` ${id}-birthDate-error` : ""}`}
              aria-invalid={Boolean(effectiveErrors.birthDate)}
              autoComplete="off"
              className="mt-2 w-full"
              id={`${id}-birthDate`}
              onChange={(event) => {
                setBirthDate(event.target.value);
                setConfirmed(false);
                edited();
              }}
              required
              type="date"
              value={birthDate}
            />
            <p className="mt-2 text-sm text-text-muted" id={`${id}-birth-hint`}>
              A idade é validada pelo sistema na data institucional. Não
              armazenamos cópia de documento nesta tela.
            </p>
            {error("birthDate")}
          </div>
          <div className="self-center">
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                aria-describedby={
                  effectiveErrors.birthDateConfirmed
                    ? `${id}-birthDateConfirmed-error`
                    : undefined
                }
                aria-invalid={Boolean(effectiveErrors.birthDateConfirmed)}
                checked={confirmed}
                className="mt-1 size-5 shrink-0 accent-primary"
                onChange={(event) => {
                  setConfirmed(event.target.checked);
                  edited();
                }}
                required
                type="checkbox"
              />
              Conferi a data de nascimento com a pessoa ou documento apropriado.
            </label>
            {error("birthDateConfirmed")}
          </div>
          <CampusVehicleFields
            disabled={locked}
            errors={effectiveErrors}
            onChange={(value) => {
              setVehicle(value);
              edited();
            }}
            value={vehicle}
          />
        </fieldset>
        {possibleDuplicate && (
          <div className="mt-5 rounded-xl border border-border bg-surface-subtle p-4">
            <p className="text-sm leading-6">
              Confira os registros existentes na consulta abaixo. Para adicionar
              outro veículo, use o cadastro da pessoa existente.
            </p>
            <label className="mt-3 flex items-start gap-3 text-sm leading-6">
              <input
                aria-describedby={
                  effectiveErrors.confirmPossibleDuplicate
                    ? `${id}-confirmPossibleDuplicate-error`
                    : undefined
                }
                aria-invalid={Boolean(effectiveErrors.confirmPossibleDuplicate)}
                checked={duplicateConfirmed}
                className="mt-1 size-5 shrink-0 accent-primary"
                disabled={locked}
                onChange={(event) =>
                  setDuplicateConfirmed(event.target.checked)
                }
                type="checkbox"
              />
              Conferi o cadastro existente e confirmo que é outra pessoa
              (homônimo).
            </label>
            {error("confirmPossibleDuplicate")}
          </div>
        )}
        <div className="mt-5" ref={feedbackRef}>
          <ActionFeedback
            message={
              serverMessage ||
              (failed
                ? "Não foi possível concluir o pré-cadastro. Os campos foram mantidos."
                : null)
            }
            tone="error"
          />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <Button disabled={busy} onClick={onCancel} variant="secondary">
            Cancelar
          </Button>
          <Button disabled={locked} type="submit">
            {busy ? "Enviando…" : "Pré-cadastrar"}
          </Button>
        </div>
      </form>
    </section>
  );
}
