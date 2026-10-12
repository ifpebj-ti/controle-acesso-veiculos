import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import type { InstitutionalVehicle } from "../../institutional-vehicles";
import { getVehiclePresentation } from "../../access-records/model/vehicleTypePresentation";
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
        className="mt-1.5 text-xs text-ink-soft"
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
        <Button
          disabled={disabled}
          onClick={onCancel}
          type="button"
          variant="secondary"
        >
          Cancelar
        </Button>
        <Button disabled={disabled} type="submit">
          {disabled ? "Registrando…" : "Confirmar retorno"}
        </Button>
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
  vehicles: InstitutionalVehicle[];
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
  vehicles,
}: OpenInstitutionalUsagesProps) {
  return (
    <section
      aria-busy={status === "loading"}
      aria-labelledby="open-institutional-title"
      className="institutional-catalog mt-7 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]"
    >
      <div className="usage-active-heading flex flex-wrap items-start gap-3 border-b border-ink/10 px-5 py-5 sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl rounded-bl-md bg-success-surface text-primary">
          <Icon name="car" size={23} />
        </span>
        <div>
          <h2 className="text-xl font-bold" id="open-institutional-title">
            Veículos em uso
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Veículos que estão com saída registrada e ainda não retornaram.
          </p>
        </div>
        {status === "ready" && (
          <p
            aria-live="polite"
            className="ml-auto rounded-full bg-success-surface px-3 py-1 text-xs font-bold text-success-text"
          >
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
          <p className="mt-1 text-sm text-ink-soft">
            Uma saída registrada aparecerá aqui até a confirmação do retorno.
          </p>
        </div>
      ) : (
        <div className="usage-active-grid grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
          {usages.map((usage) => {
            const vehicle = vehicles.find(
              (item) => item.id === usage.vehicleId,
            );
            const presentation = getVehiclePresentation(vehicle?.vehicleType);

            return (
              <article
                className="usage-active-card rounded-2xl border border-border bg-surface p-5 shadow-[0_8px_22px_rgba(1,36,40,0.04)]"
                data-vehicle-kind={presentation.kind}
                key={usage.id}
              >
                <div className="grid gap-4 sm:grid-cols-[5.5rem_1fr]">
                  <span
                    aria-hidden="true"
                    className="usage-active-card__visual grid min-h-24 place-items-center rounded-2xl text-primary"
                  >
                    <Icon
                      name={presentation.icon}
                      size={46}
                      strokeWidth={1.5}
                    />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="break-words font-mono text-lg font-bold text-ink">
                        {vehicleLabel(usage)}
                      </h3>
                      <span className="rounded-full border border-success-border bg-success-surface px-3 py-1 text-xs font-bold text-success-text">
                        Em uso
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-ink-soft">
                      {presentation.label}
                    </p>
                    <dl className="usage-active-card__details mt-3 grid gap-2 text-sm text-ink-soft">
                      <div className="flex items-start gap-2">
                        <Icon
                          className="mt-0.5 shrink-0 text-primary"
                          name="user"
                          size={16}
                        />
                        <dt className="sr-only">Motorista</dt>
                        <dd className="break-words">{usage.driverName}</dd>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon
                          className="mt-0.5 shrink-0 text-primary"
                          name="calendar"
                          size={16}
                        />
                        <dt className="sr-only">Saída</dt>
                        <dd>
                          {dateTimeFormatter.format(
                            new Date(usage.departureAtUtc),
                          )}
                        </dd>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon
                          className="mt-0.5 shrink-0 text-primary"
                          name="history"
                          size={16}
                        />
                        <dt className="sr-only">Itinerário</dt>
                        <dd className="break-words">{usage.itinerary}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
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
                  <Button
                    className="mt-5 w-full"
                    disabled={pendingAction !== null}
                    onClick={() => onOpenReturn(usage)}
                    type="button"
                  >
                    <Icon name="log-out" size={17} /> Registrar retorno
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
