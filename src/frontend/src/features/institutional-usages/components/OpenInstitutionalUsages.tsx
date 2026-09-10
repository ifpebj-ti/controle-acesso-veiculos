import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Icon } from "../../../components/ui/Icon";
import {
  institutionalReturnFormSchema,
  type InstitutionalReturnFormValues,
} from "../schemas/institutionalUsageSchemas";
import type {
  InstitutionalReturnInput,
  InstitutionalUsageServerErrors,
  InstitutionalVehicleUsage,
} from "../types";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function vehicleLabel(usage: InstitutionalVehicleUsage) {
  return (
    usage.plate ?? usage.vehicleIdentification ?? `Veículo ${usage.vehicleId}`
  );
}

interface ReturnFormProps {
  busy: boolean;
  formError: string | null;
  onCancel: () => void;
  onSubmit: (input: InstitutionalReturnInput) => Promise<void>;
  serverErrors: InstitutionalUsageServerErrors;
  usage: InstitutionalVehicleUsage;
}

function ReturnForm({
  busy,
  formError,
  onCancel,
  onSubmit,
  serverErrors,
  usage,
}: ReturnFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<InstitutionalReturnFormValues>({
    defaultValues: { returnMileage: usage.departureMileage },
    resolver: zodResolver(
      institutionalReturnFormSchema(usage.departureMileage),
    ),
  });
  const disabled = busy || isSubmitting;
  const message = errors.returnMileage?.message ?? serverErrors.returnMileage;

  return (
    <form
      className="mt-4 rounded-2xl border border-brand-dark/15 bg-brand-soft/20 p-4"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      {formError && (
        <p className="mb-3 text-sm font-semibold text-red-800" role="alert">
          {formError}
        </p>
      )}
      <label
        className="text-sm font-semibold text-ink"
        htmlFor={`usage-return-${usage.id}`}
      >
        Quilometragem no retorno
      </label>
      <input
        aria-describedby={
          message
            ? `usage-return-${usage.id}-hint usage-return-${usage.id}-error`
            : `usage-return-${usage.id}-hint`
        }
        aria-invalid={Boolean(message)}
        autoFocus
        className="mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-white px-4 outline-none focus:border-brand-dark focus:ring-3 focus:ring-brand/20 disabled:opacity-60"
        disabled={disabled}
        id={`usage-return-${usage.id}`}
        min={usage.departureMileage}
        type="number"
        {...register("returnMileage")}
      />
      <p
        className="mt-1.5 text-xs text-ink/60"
        id={`usage-return-${usage.id}-hint`}
      >
        Deve ser igual ou superior aos {usage.departureMileage} km registrados
        na saída.
      </p>
      {message && (
        <p
          className="mt-1.5 text-sm text-red-800"
          id={`usage-return-${usage.id}-error`}
        >
          {message}
        </p>
      )}
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          className="min-h-11 rounded-xl border border-ink/20 px-4 text-sm font-bold disabled:opacity-60"
          disabled={disabled}
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="min-h-11 rounded-xl bg-brand-dark px-5 text-sm font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:bg-brand-soft disabled:text-ink disabled:opacity-100"
          disabled={disabled}
          type="submit"
        >
          {disabled ? "Registrando…" : "Confirmar retorno"}
        </button>
      </div>
    </form>
  );
}

interface OpenInstitutionalUsagesProps {
  formError: string | null;
  onCloseReturn: () => void;
  onOpenReturn: (usage: InstitutionalVehicleUsage) => void;
  onReturn: (input: InstitutionalReturnInput) => Promise<void>;
  pendingAction: string | null;
  returningUsage: InstitutionalVehicleUsage | null;
  serverErrors: InstitutionalUsageServerErrors;
  status: "idle" | "loading" | "ready" | "error" | "denied";
  usages: InstitutionalVehicleUsage[];
}

export function OpenInstitutionalUsages({
  formError,
  onCloseReturn,
  onOpenReturn,
  onReturn,
  pendingAction,
  returningUsage,
  serverErrors,
  status,
  usages,
}: OpenInstitutionalUsagesProps) {
  return (
    <section
      aria-busy={status === "loading"}
      aria-labelledby="open-institutional-title"
      className="mt-7 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]"
    >
      <div className="border-b border-ink/10 px-5 py-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Operação atual
        </p>
        <h2
          className="mt-1 font-display text-2xl"
          id="open-institutional-title"
        >
          Veículos em uso
        </h2>
        {status === "ready" && (
          <p aria-live="polite" className="mt-1 text-sm text-ink/60">
            {usages.length} veículo(s) aguardando retorno
          </p>
        )}
      </div>

      {status === "loading" ? (
        <div className="p-10 text-center" role="status">
          Carregando veículos em uso…
        </div>
      ) : status !== "ready" ? null : usages.length === 0 ? (
        <div className="m-5 rounded-2xl border border-dashed border-ink/20 bg-cream/40 p-10 text-center sm:m-6">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft/45">
            <Icon name="bus" />
          </span>
          <p className="mt-4 font-bold">Nenhum veículo institucional em uso</p>
          <p className="mt-1 text-sm text-ink/60">
            Uma saída registrada aparecerá aqui até a confirmação do retorno.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
          {usages.map((usage) => (
            <article
              className="rounded-2xl border border-ink/10 bg-cream/25 p-5"
              key={usage.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                    {vehicleLabel(usage)}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{usage.driverName}</h3>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  Em uso
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink/55">Saída</dt>
                  <dd className="font-semibold">
                    {dateTimeFormatter.format(new Date(usage.departureAtUtc))}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink/55">Quilometragem</dt>
                  <dd className="font-semibold">{usage.departureMileage} km</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-ink/55">Itinerário</dt>
                  <dd className="break-words font-semibold">
                    {usage.itinerary}
                  </dd>
                </div>
              </dl>
              {returningUsage?.id === usage.id ? (
                <ReturnForm
                  busy={pendingAction !== null}
                  formError={formError}
                  onCancel={onCloseReturn}
                  onSubmit={onReturn}
                  serverErrors={serverErrors}
                  usage={usage}
                />
              ) : (
                <button
                  className="mt-5 min-h-11 w-full rounded-xl bg-ink px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
                  disabled={pendingAction !== null}
                  onClick={() => onOpenReturn(usage)}
                  type="button"
                >
                  Registrar retorno
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
