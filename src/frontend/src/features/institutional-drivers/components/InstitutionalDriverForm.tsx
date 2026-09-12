import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import {
  institutionalDriverFormSchema,
  type InstitutionalDriverFormValues,
} from "../schemas/institutionalDriverSchemas";
import type { InstitutionalDriverInput } from "../types";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

export type InstitutionalDriverField = keyof InstitutionalDriverFormValues;

interface InstitutionalDriverFormProps {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: InstitutionalDriverInput) => Promise<void>;
  serverErrors: Partial<Record<InstitutionalDriverField, string>>;
}

function errorId(field: InstitutionalDriverField) {
  return `driver-${field}-error`;
}

function optionalValue(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

export function InstitutionalDriverForm({
  busy,
  onCancel,
  onSubmit,
  serverErrors,
}: InstitutionalDriverFormProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<InstitutionalDriverFormValues>({
    defaultValues: { documentNumber: "", documentType: "", name: "" },
    resolver: zodResolver(institutionalDriverFormSchema),
  });
  const disabled = busy || isSubmitting;

  useEffect(() => titleRef.current?.focus(), []);

  function errorFor(field: InstitutionalDriverField) {
    return errors[field]?.message ?? serverErrors[field];
  }

  function fieldError(field: InstitutionalDriverField) {
    const message = errorFor(field);
    return message ? (
      <p className="mt-1.5 text-sm text-red-800" id={errorId(field)}>
        {message}
      </p>
    ) : null;
  }

  async function submit(values: InstitutionalDriverFormValues) {
    await onSubmit({
      documentNumber: optionalValue(values.documentNumber),
      documentType: optionalValue(values.documentType),
      name: values.name.trim(),
    });
  }

  return (
    <section
      aria-labelledby="driver-form-title"
      className="mt-6 overflow-hidden rounded-[2rem] border border-brand-dark/15 bg-white shadow-[0_14px_40px_rgba(1,36,40,0.07)]"
    >
      <div className="border-b border-ink/8 bg-brand-soft/30 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Autorização institucional
        </p>
        <h2
          className="mt-1 font-display text-2xl text-ink"
          id="driver-form-title"
          ref={titleRef}
          tabIndex={-1}
        >
          Autorizar motorista
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">
          O nome é obrigatório. Documento é opcional e não será exibido no
          catálogo; se necessário, informe tipo e número juntos.
        </p>
      </div>

      <form
        className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="driver-name"
          >
            Nome completo
          </label>
          <input
            aria-describedby={errorFor("name") ? errorId("name") : undefined}
            aria-invalid={Boolean(errorFor("name"))}
            autoComplete="off"
            className={fieldClass}
            id="driver-name"
            maxLength={200}
            {...register("name")}
          />
          {fieldError("name")}
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="driver-document-type"
          >
            Tipo de documento{" "}
            <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <input
            aria-describedby={
              errorFor("documentType") ? errorId("documentType") : undefined
            }
            aria-invalid={Boolean(errorFor("documentType"))}
            autoComplete="off"
            className={fieldClass}
            id="driver-document-type"
            maxLength={10}
            placeholder="Ex.: CPF"
            {...register("documentType")}
          />
          {fieldError("documentType")}
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="driver-document-number"
          >
            Número do documento{" "}
            <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <input
            aria-describedby={
              errorFor("documentNumber") ? errorId("documentNumber") : undefined
            }
            aria-invalid={Boolean(errorFor("documentNumber"))}
            autoComplete="off"
            className={fieldClass}
            id="driver-document-number"
            maxLength={20}
            {...register("documentNumber")}
          />
          {fieldError("documentNumber")}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-3">
          <button
            className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25 disabled:cursor-wait disabled:opacity-60"
            disabled={disabled}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="min-h-12 rounded-xl bg-brand-dark px-7 font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:bg-brand-soft disabled:text-ink disabled:opacity-100"
            disabled={disabled}
            type="submit"
          >
            {disabled ? "Autorizando…" : "Autorizar motorista"}
          </button>
        </div>
      </form>
    </section>
  );
}
