import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import { generalAccessCategories } from "../model/accessCategories";
import {
  accessCorrectionFormSchema,
  type AccessCorrectionFormValues,
} from "../schemas/accessRecordSchemas";
import {
  AccessRecordsContractError,
  correctAccessRecord,
} from "../services/accessRecordsService";
import type { AccessRecord } from "../types";

interface AccessCorrectionDialogProps {
  onClose: () => void;
  onCorrected: (record: AccessRecord) => void;
  record: AccessRecord;
  returnFocusTo: HTMLElement | null;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 py-3 text-ink outline-none transition focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20 disabled:cursor-wait disabled:opacity-65";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-red-800" id={id}>
      {message}
    </p>
  );
}

function statusLabel(record: AccessRecord) {
  return record.exitAtUtc ? "Encerrado" : "Em aberto";
}

export function AccessCorrectionDialog({
  onClose,
  onCorrected,
  record,
  returnFocusTo,
}: AccessCorrectionDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const objectiveRef = useRef<HTMLTextAreaElement | null>(null);
  const closeRef = useRef(onClose);
  const submittingRef = useRef(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<AccessCorrectionFormValues>({
    defaultValues: {
      categoryName: record.categoryName,
      justification: "",
      objective: record.objective,
      observation: record.observation ?? "",
    },
    resolver: zodResolver(accessCorrectionFormSchema),
  });
  const objectiveRegistration = register("objective");

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    submittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    objectiveRef.current?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!submittingRef.current) {
          event.preventDefault();
          closeRef.current();
        }
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      window.removeEventListener("keydown", handleDialogKeyDown);
      returnFocusTo?.focus();
    };
  }, [returnFocusTo]);

  async function submit(values: AccessCorrectionFormValues) {
    setRequestError(null);

    try {
      const corrected = await correctAccessRecord(record.id, {
        categoryName: values.categoryName,
        justification: values.justification.trim(),
        objective: values.objective.trim(),
        observation: values.observation.trim() || null,
      });
      onCorrected(corrected);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      const fieldNames: Record<string, keyof AccessCorrectionFormValues> = {
        categoryName: "categoryName",
        justification: "justification",
        objective: "objective",
        observation: "observation",
      };
      let hasFieldError = false;

      for (const [apiField, message] of Object.entries(validationErrors)) {
        const field = fieldNames[apiField];
        if (!field) continue;
        setError(field, { message, type: "server" });
        hasFieldError = true;
      }

      if (error instanceof AccessRecordsContractError) {
        setRequestError(
          "A resposta da correção não pôde ser validada. O registro exibido não foi alterado.",
        );
        return;
      }

      const description = describeApiError(error);
      const recordError = validationErrors.accessRecord;
      if (recordError) {
        setRequestError(recordError);
      } else if (description.status === 404) {
        setRequestError(
          "O registro não existe mais ou não está disponível para correção.",
        );
      } else if (hasFieldError) {
        setRequestError("Revise os campos destacados e tente novamente.");
      } else {
        setRequestError(description.message);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-ink/55 p-0 sm:items-center sm:p-6">
      <div
        aria-describedby="access-correction-audit-note"
        aria-labelledby="access-correction-title"
        aria-modal="true"
        className="max-h-[100svh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:mx-auto sm:max-h-[calc(100svh-3rem)] sm:max-w-3xl sm:rounded-[2rem] sm:p-7"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Registro #{record.id}
            </p>
            <h2
              className="mt-1 font-display text-3xl text-ink"
              id="access-correction-title"
            >
              Corrigir registro
            </h2>
          </div>
          <button
            aria-label="Fechar correção"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-ink/15 text-xl text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <dl className="mt-6 grid gap-4 rounded-2xl bg-cream/45 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-bold text-ink/60">Placa</dt>
            <dd className="mt-1 text-ink">{record.plate}</dd>
          </div>
          <div>
            <dt className="font-bold text-ink/60">Condutor</dt>
            <dd className="mt-1 text-ink">{record.driverName}</dd>
          </div>
          <div>
            <dt className="font-bold text-ink/60">Entrada</dt>
            <dd className="mt-1 text-ink">
              {dateFormatter.format(new Date(record.entryAtUtc))}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-ink/60">Saída</dt>
            <dd className="mt-1 text-ink">
              {record.exitAtUtc
                ? dateFormatter.format(new Date(record.exitAtUtc))
                : "Ainda não registrada"}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-ink/60">Situação</dt>
            <dd className="mt-1 text-ink">{statusLabel(record)}</dd>
          </div>
          <div>
            <dt className="font-bold text-ink/60">Autoria original</dt>
            <dd className="mt-1 text-ink">Usuário #{record.createdById}</dd>
          </div>
          {record.eventAuthorizationName?.trim() && (
            <div className="sm:col-span-2">
              <dt className="font-bold text-ink/60">Evento associado</dt>
              <dd className="mt-1 text-ink">{record.eventAuthorizationName}</dd>
            </div>
          )}
        </dl>

        <p
          className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"
          id="access-correction-audit-note"
        >
          A correção e sua justificativa serão registradas na trilha de
          auditoria.
        </p>

        {requestError && (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            role="alert"
          >
            {requestError}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)}>
          <div>
            <label
              className="font-bold text-ink"
              htmlFor="correction-objective"
            >
              Objetivo
            </label>
            <textarea
              {...objectiveRegistration}
              aria-describedby={
                errors.objective ? "correction-objective-error" : undefined
              }
              aria-invalid={Boolean(errors.objective)}
              className={fieldClass}
              disabled={isSubmitting}
              id="correction-objective"
              maxLength={500}
              ref={(element) => {
                objectiveRegistration.ref(element);
                objectiveRef.current = element;
              }}
              rows={3}
            />
            <FieldError
              id="correction-objective-error"
              message={errors.objective?.message}
            />
          </div>

          <div>
            <label className="font-bold text-ink" htmlFor="correction-category">
              Categoria
            </label>
            <select
              {...register("categoryName")}
              aria-describedby={
                errors.categoryName ? "correction-category-error" : undefined
              }
              aria-invalid={Boolean(errors.categoryName)}
              className={fieldClass}
              disabled={isSubmitting}
              id="correction-category"
            >
              {generalAccessCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <FieldError
              id="correction-category-error"
              message={errors.categoryName?.message}
            />
          </div>

          <div>
            <label
              className="font-bold text-ink"
              htmlFor="correction-observation"
            >
              Observação{" "}
              <span className="font-normal text-ink/55">(opcional)</span>
            </label>
            <textarea
              {...register("observation")}
              aria-describedby={
                errors.observation ? "correction-observation-error" : undefined
              }
              aria-invalid={Boolean(errors.observation)}
              className={fieldClass}
              disabled={isSubmitting}
              id="correction-observation"
              maxLength={1000}
              rows={3}
            />
            <FieldError
              id="correction-observation-error"
              message={errors.observation?.message}
            />
          </div>

          <div>
            <label
              className="font-bold text-ink"
              htmlFor="correction-justification"
            >
              Justificativa da correção
            </label>
            <textarea
              {...register("justification")}
              aria-describedby={`correction-justification-guidance${
                errors.justification ? " correction-justification-error" : ""
              }`}
              aria-invalid={Boolean(errors.justification)}
              className={fieldClass}
              disabled={isSubmitting}
              id="correction-justification"
              maxLength={500}
              rows={3}
            />
            <p
              className="mt-1 text-xs text-ink/60"
              id="correction-justification-guidance"
            >
              Informe entre 10 e 500 caracteres.
            </p>
            <FieldError
              id="correction-justification-error"
              message={errors.justification?.message}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
            <button
              className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="min-h-12 rounded-xl bg-brand-dark px-6 font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/45 disabled:cursor-wait disabled:opacity-65"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Salvando correção…" : "Salvar correção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
