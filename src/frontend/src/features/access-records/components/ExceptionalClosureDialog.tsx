import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Controller, useForm } from "react-hook-form";

import { SelectField } from "../../../components/ui/SelectField";
import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import {
  exceptionalClosureReasonLabels,
  exceptionalClosureReasons,
} from "../model/exceptionalClosure";
import {
  exceptionalClosureFormSchema,
  type ExceptionalClosureFormValues,
} from "../schemas/accessRecordSchemas";
import { AccessRecordsContractError } from "../services/accessRecordsService";
import type {
  AccessRecord,
  ExceptionallyCloseAccessRecordInput,
} from "../types";

interface ExceptionalClosureDialogProps {
  onCancel: () => void;
  onClosed: (record: AccessRecord) => void;
  onConfirm: (
    input: ExceptionallyCloseAccessRecordInput,
  ) => Promise<AccessRecord>;
  record: AccessRecord;
  returnFocusTo: HTMLElement | null;
  successFocusRef: RefObject<HTMLElement | null>;
}

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

export function ExceptionalClosureDialog({
  onCancel,
  onClosed,
  onConfirm,
  record,
  returnFocusTo,
  successFocusRef,
}: ExceptionalClosureDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onCancel);
  const submittingRef = useRef(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<ExceptionalClosureFormValues>({
    defaultValues: {
      observation: "",
      observedExitAtLocal: "",
      reason: "",
    },
    resolver: zodResolver(exceptionalClosureFormSchema),
  });

  useEffect(() => {
    closeRef.current = onCancel;
    submittingRef.current = isSubmitting;
  }, [isSubmitting, onCancel]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const successFocusTarget = successFocusRef.current;
    const dialogElement = dialogRef.current;
    document.body.style.overflow = "hidden";
    document.getElementById("exceptional-closure-reason")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!submittingRef.current) {
          event.preventDefault();
          closeRef.current();
        }
        return;
      }

      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!controls?.length) return;

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const target = returnFocusTo?.isConnected
        ? returnFocusTo
        : successFocusTarget;
      window.requestAnimationFrame(() => {
        if (dialogElement?.isConnected) return;
        target?.focus();
      });
    };
  }, [returnFocusTo, successFocusRef]);

  async function submit(values: ExceptionalClosureFormValues) {
    setRequestError(null);

    try {
      const closed = await onConfirm({
        observation: values.observation.trim(),
        observedExitAtUtc: values.observedExitAtLocal
          ? new Date(values.observedExitAtLocal).toISOString()
          : null,
        reason: values.reason as ExceptionallyCloseAccessRecordInput["reason"],
      });
      onClosed(closed);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      const fieldNames = {
        observation: "observation",
        observedExitAtUtc: "observedExitAtLocal",
        reason: "reason",
      } as const;
      let hasFieldError = false;

      for (const [apiField, message] of Object.entries(validationErrors)) {
        const field = fieldNames[apiField as keyof typeof fieldNames];
        if (!field) continue;
        setError(field, { message, type: "server" });
        hasFieldError = true;
      }

      if (error instanceof AccessRecordsContractError) {
        setRequestError(
          "A resposta da regularização não pôde ser validada. O acesso exibido não foi alterado.",
        );
        return;
      }

      const description = describeApiError(error);
      if (description.status === 404) {
        setRequestError(
          "O acesso não existe mais ou não está disponível para regularização.",
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
        aria-describedby="exceptional-closure-guidance"
        aria-labelledby="exceptional-closure-title"
        aria-modal="true"
        className="max-h-[100svh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:mx-auto sm:max-h-[calc(100svh-3rem)] sm:max-w-2xl sm:rounded-[2rem] sm:p-7"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Encerramento excepcional
            </p>
            <h2
              className="mt-3 font-display text-3xl text-ink"
              id="exceptional-closure-title"
            >
              Regularizar saída não registrada
            </h2>
          </div>
          <button
            aria-label="Fechar regularização"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-ink/15 text-xl text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <dl className="mt-5 grid gap-3 rounded-2xl bg-cream/45 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-bold text-ink-soft">Placa</dt>
            <dd className="mt-1 text-ink">{record.plate}</dd>
          </div>
          <div>
            <dt className="font-bold text-ink-soft">Condutor</dt>
            <dd className="mt-1 break-words text-ink">{record.driverName}</dd>
          </div>
        </dl>

        <p
          className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950"
          id="exceptional-closure-guidance"
        >
          Use esta regularização somente quando a saída não foi registrada no
          momento real. Informe o horário observado apenas quando existir uma
          fonte confiável; o sistema não estima esse horário.
        </p>

        {requestError && (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            role="alert"
          >
            {requestError}
          </div>
        )}

        <form
          className="mt-5 grid gap-5"
          noValidate
          onSubmit={handleSubmit(submit)}
        >
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="exceptional-closure-reason"
            >
              Motivo <span aria-hidden="true">*</span>
            </label>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <SelectField
                  aria-describedby={
                    errors.reason ? "exceptional-reason-error" : undefined
                  }
                  aria-invalid={Boolean(errors.reason)}
                  className={fieldClass}
                  disabled={isSubmitting}
                  id="exceptional-closure-reason"
                  onBlur={field.onBlur}
                  onValueChange={field.onChange}
                  options={exceptionalClosureReasons.map((reason) => ({
                    label: exceptionalClosureReasonLabels[reason],
                    value: reason,
                  }))}
                  placeholder="Selecione o motivo"
                  required
                  value={field.value}
                />
              )}
            />
            <FieldError
              id="exceptional-reason-error"
              message={errors.reason?.message}
            />
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="exceptional-closure-observation"
            >
              Observação <span aria-hidden="true">*</span>
            </label>
            <textarea
              aria-describedby={
                errors.observation
                  ? "exceptional-observation-error"
                  : "exceptional-observation-hint"
              }
              aria-invalid={Boolean(errors.observation)}
              className={`${fieldClass} min-h-28 resize-none`}
              disabled={isSubmitting}
              id="exceptional-closure-observation"
              maxLength={1000}
              {...register("observation")}
            />
            <p
              className="mt-1 text-xs text-ink-soft"
              id="exceptional-observation-hint"
            >
              Registre como a saída foi confirmada posteriormente.
            </p>
            <FieldError
              id="exceptional-observation-error"
              message={errors.observation?.message}
            />
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="exceptional-closure-observed-at"
            >
              Horário observado da saída (opcional)
            </label>
            <input
              aria-describedby={
                errors.observedExitAtLocal
                  ? "exceptional-observed-at-error"
                  : "exceptional-observed-at-hint"
              }
              aria-invalid={Boolean(errors.observedExitAtLocal)}
              className={fieldClass}
              disabled={isSubmitting}
              id="exceptional-closure-observed-at"
              type="datetime-local"
              {...register("observedExitAtLocal")}
            />
            <p
              className="mt-1 text-xs leading-5 text-ink-soft"
              id="exceptional-observed-at-hint"
            >
              Deixe vazio quando não houver uma fonte confiável. O momento da
              regularização será registrado separadamente pelo servidor.
            </p>
            <FieldError
              id="exceptional-observed-at-error"
              message={errors.observedExitAtLocal?.message}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
            <button
              className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onCancel}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="min-h-12 rounded-xl bg-brand-dark px-6 font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/45 disabled:cursor-wait disabled:opacity-65"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? "Regularizando saída…"
                : "Confirmar regularização excepcional"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
