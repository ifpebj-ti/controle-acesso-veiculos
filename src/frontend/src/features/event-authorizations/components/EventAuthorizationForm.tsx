import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import {
  eventAuthorizationFormSchema,
  type EventAuthorizationFormValues,
} from "../schemas/eventAuthorizationSchemas";
import type {
  EventAuthorization,
  EventAuthorizationInput,
  EventAuthorizationServerErrors,
} from "../types";
import { EventVehicleRulesFields } from "./EventVehicleRulesFields";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20 disabled:opacity-60";

interface EventAuthorizationFormProps {
  busy: boolean;
  event: EventAuthorization | null;
  onCancel: () => void;
  onSubmit: (input: EventAuthorizationInput) => Promise<void>;
  serverErrors: EventAuthorizationServerErrors;
}

function toLocalInput(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultValues(
  event: EventAuthorization | null,
): EventAuthorizationFormValues {
  if (!event) {
    return {
      area: "",
      endsAtLocal: "",
      name: "",
      notes: "",
      overnightAllowed: false,
      responsible: "",
      startsAtLocal: "",
      vehicleRules: [
        { mode: "quota", plate: "", quantity: 1, vehicleType: "" },
      ],
    };
  }
  return {
    area: event.area,
    endsAtLocal: toLocalInput(event.endsAtUtc),
    name: event.name,
    notes: event.notes ?? "",
    overnightAllowed: event.overnightAllowed,
    responsible: event.responsible,
    startsAtLocal: toLocalInput(event.startsAtUtc),
    vehicleRules: event.vehicleRules.map((rule) => ({
      mode: rule.plate ? "plate" : "quota",
      plate: rule.plate ?? "",
      quantity: rule.quantity,
      vehicleType: rule.vehicleType,
    })),
  };
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="mt-1.5 text-sm text-red-800" id={id}>
      {message}
    </p>
  ) : null;
}

export function EventAuthorizationForm({
  busy,
  event,
  onCancel,
  onSubmit,
  serverErrors,
}: EventAuthorizationFormProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<EventAuthorizationFormValues>({
    defaultValues: defaultValues(event),
    resolver: zodResolver(eventAuthorizationFormSchema),
  });
  const disabled = busy || isSubmitting;

  useEffect(() => titleRef.current?.focus(), []);

  function errorFor(field: string, localMessage?: string) {
    return localMessage ?? serverErrors[field];
  }

  async function submit(values: EventAuthorizationFormValues) {
    await onSubmit({
      area: values.area.trim(),
      endsAtUtc: new Date(values.endsAtLocal).toISOString(),
      name: values.name.trim(),
      notes: values.notes.trim() || null,
      overnightAllowed: values.overnightAllowed,
      responsible: values.responsible.trim(),
      startsAtUtc: new Date(values.startsAtLocal).toISOString(),
      vehicleRules: values.vehicleRules.map((rule) => ({
        plate: rule.mode === "plate" ? rule.plate.trim() : null,
        quantity: rule.mode === "plate" ? 1 : rule.quantity,
        vehicleType: rule.vehicleType.trim(),
      })),
    });
  }

  const simpleFields = [
    { id: "event-name", key: "name", label: "Nome do evento", maxLength: 200 },
    {
      id: "event-responsible",
      key: "responsible",
      label: "Responsável",
      maxLength: 200,
    },
    { id: "event-area", key: "area", label: "Local ou área", maxLength: 200 },
  ] as const;

  return (
    <section
      aria-labelledby="event-form-title"
      className="mt-6 overflow-hidden rounded-[2rem] border border-brand-dark/15 bg-white shadow-[0_14px_40px_rgba(1,36,40,0.07)]"
    >
      <div className="border-b border-ink/8 bg-brand-soft/30 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Autorização antecipada
        </p>
        <h2
          className="mt-1 font-display text-2xl text-ink"
          id="event-form-title"
          ref={titleRef}
          tabIndex={-1}
        >
          {event ? "Editar autorização" : "Nova autorização de evento"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">
          A autorização apoia a conferência. Cada entrada continua sendo
          registrada separadamente na portaria.
        </p>
      </div>
      <form
        className="space-y-7 p-5 sm:p-7"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {simpleFields.map((field) => {
            const message = errorFor(field.key, errors[field.key]?.message);
            const errorId = `${field.id}-error`;
            return (
              <div key={field.key}>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor={field.id}
                >
                  {field.label}
                </label>
                <input
                  aria-describedby={message ? errorId : undefined}
                  aria-invalid={Boolean(message)}
                  className={fieldClass}
                  disabled={disabled}
                  id={field.id}
                  maxLength={field.maxLength}
                  {...register(field.key)}
                />
                <ErrorMessage id={errorId} message={message} />
              </div>
            );
          })}
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="event-start"
            >
              Início
            </label>
            {(() => {
              const message =
                errorFor("startsAtUtc", errors.startsAtLocal?.message) ??
                serverErrors.period;
              return (
                <>
                  <input
                    aria-describedby={
                      message
                        ? "event-start-error event-period-hint"
                        : "event-period-hint"
                    }
                    aria-invalid={Boolean(message)}
                    className={fieldClass}
                    disabled={disabled}
                    id="event-start"
                    type="datetime-local"
                    {...register("startsAtLocal")}
                  />
                  <ErrorMessage id="event-start-error" message={message} />
                </>
              );
            })()}
          </div>
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="event-end"
            >
              Fim
            </label>
            {(() => {
              const message =
                errorFor("endsAtUtc", errors.endsAtLocal?.message) ??
                serverErrors.period;
              return (
                <>
                  <input
                    aria-describedby={
                      message
                        ? "event-end-error event-period-hint"
                        : "event-period-hint"
                    }
                    aria-invalid={Boolean(message)}
                    className={fieldClass}
                    disabled={disabled}
                    id="event-end"
                    type="datetime-local"
                    {...register("endsAtLocal")}
                  />
                  <ErrorMessage id="event-end-error" message={message} />
                </>
              );
            })()}
          </div>
          <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-ink/15 bg-cream/45 px-4 text-sm font-semibold text-ink">
            <input
              className="size-5 accent-brand"
              disabled={disabled}
              type="checkbox"
              {...register("overnightAllowed")}
            />
            Permitir pernoite
          </label>
          <p
            className="text-xs text-ink/60 md:col-span-3"
            id="event-period-hint"
          >
            Informe data e hora locais. O servidor armazenará o período em UTC.
          </p>
        </div>

        <EventVehicleRulesFields
          control={control}
          disabled={disabled}
          errors={errors}
          register={register}
          serverErrors={serverErrors}
          setValue={setValue}
        />

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="event-notes"
          >
            Observação{" "}
            <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          {(() => {
            const message = errorFor("notes", errors.notes?.message);
            return (
              <>
                <textarea
                  aria-describedby={message ? "event-notes-error" : undefined}
                  aria-invalid={Boolean(message)}
                  className={`${fieldClass} min-h-28 py-3`}
                  disabled={disabled}
                  id="event-notes"
                  maxLength={1000}
                  {...register("notes")}
                />
                <ErrorMessage id="event-notes-error" message={message} />
              </>
            );
          })()}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
          <button
            className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink disabled:opacity-60"
            disabled={disabled}
            onClick={onCancel}
            type="button"
          >
            Fechar formulário
          </button>
          <button
            className="min-h-12 rounded-xl bg-brand-dark px-7 font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:bg-brand-soft disabled:text-ink disabled:opacity-100"
            disabled={disabled}
            type="submit"
          >
            {disabled
              ? "Salvando…"
              : event
                ? "Salvar alterações"
                : "Criar autorização"}
          </button>
        </div>
      </form>
    </section>
  );
}
