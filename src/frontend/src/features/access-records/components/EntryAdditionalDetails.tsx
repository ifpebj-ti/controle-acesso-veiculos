import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { TextArea } from "../../../components/ui/TextField";
import type { AccessEntryFormValues } from "../schemas/accessRecordSchemas";

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
    <section className="rounded-xl border border-border bg-surface-subtle p-4 md:col-span-2">
      <button
        aria-controls="additional-entry-details"
        aria-expanded={open}
        className="min-h-11 w-full rounded-lg text-left font-semibold text-text outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        Detalhes adicionais
        <span className="ml-2 font-normal text-ink-soft">(opcional)</span>
      </button>
      <div className="mt-3" hidden={!open} id="additional-entry-details">
        <label className="text-sm font-semibold text-ink" htmlFor="observation">
          Observação
        </label>
        <TextArea
          aria-describedby={
            errors.observation
              ? "observation-help observation-error"
              : "observation-help"
          }
          aria-invalid={Boolean(errors.observation)}
          className="mt-2 min-h-24 resize-none py-3"
          id="observation"
          maxLength={1000}
          placeholder="Inclua somente informação necessária para a operação."
          {...register("observation")}
        />
        <p className="mt-1.5 text-xs text-ink-soft" id="observation-help">
          Evite dados pessoais que não sejam necessários para o controle do
          acesso.
        </p>
        {errors.observation?.message && (
          <p className="mt-1.5 text-sm text-danger-text" id="observation-error">
            {errors.observation.message}
          </p>
        )}
      </div>
    </section>
  );
}
