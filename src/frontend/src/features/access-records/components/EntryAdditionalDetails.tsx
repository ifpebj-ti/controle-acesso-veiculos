import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { AccessEntryFormValues } from "../schemas/accessRecordSchemas";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

interface EntryAdditionalDetailsProps {
  errors: FieldErrors<AccessEntryFormValues>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  register: UseFormRegister<AccessEntryFormValues>;
}

export function EntryAdditionalDetails({
  errors,
  onOpenChange,
  open,
  register,
}: EntryAdditionalDetailsProps) {
  return (
    <section className="md:col-span-2 rounded-2xl border border-ink/10 bg-cream/35 p-4">
      <button
        aria-controls="additional-entry-details"
        aria-expanded={open}
        className="min-h-11 w-full rounded-lg text-left font-semibold text-ink outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        Detalhes adicionais
        <span className="ml-2 font-normal text-ink/55">(opcional)</span>
      </button>
      <div className="mt-3" hidden={!open} id="additional-entry-details">
        <label className="text-sm font-semibold text-ink" htmlFor="observation">
          Observação
        </label>
        <textarea
          aria-describedby={
            errors.observation
              ? "observation-help observation-error"
              : "observation-help"
          }
          aria-invalid={Boolean(errors.observation)}
          className={`${fieldClass} min-h-24 py-3`}
          id="observation"
          maxLength={1000}
          placeholder="Inclua somente informação necessária para a operação."
          {...register("observation")}
        />
        <p className="mt-1.5 text-xs text-ink/55" id="observation-help">
          Evite dados pessoais que não sejam necessários para o controle do
          acesso.
        </p>
        {errors.observation?.message && (
          <p className="mt-1.5 text-sm text-red-800" id="observation-error">
            {errors.observation.message}
          </p>
        )}
      </div>
    </section>
  );
}
