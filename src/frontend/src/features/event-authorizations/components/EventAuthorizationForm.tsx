import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../../../components/ui/Button";
import { Icon, type IconName } from "../../../components/ui/Icon";
import { normalizeVehiclePlate } from "../../vehicle-plates/vehiclePlate";
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
  "mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-ink outline-none transition placeholder:text-ink-soft/75 focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:opacity-60";

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
    mode: "onBlur",
    reValidateMode: "onChange",
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
        plate: rule.mode === "plate" ? normalizeVehiclePlate(rule.plate) : null,
        quantity: rule.mode === "plate" ? 1 : rule.quantity,
        vehicleType: rule.vehicleType.trim(),
      })),
    });
  }

  const simpleFields: Array<{
    icon: IconName;
    id: string;
    key: "name" | "responsible" | "area";
    label: string;
    maxLength: number;
    placeholder: string;
  }> = [
    {
      icon: "calendar",
      id: "event-name",
      key: "name",
      label: "Nome do evento",
      maxLength: 200,
      placeholder: "Ex.: Semana Acadêmica de TI",
    },
    {
      icon: "user",
      id: "event-responsible",
      key: "responsible",
      label: "Responsável",
      maxLength: 200,
      placeholder: "Ex.: Coordenação de Tecnologia",
    },
    {
      icon: "dashboard",
      id: "event-area",
      key: "area",
      label: "Local ou área",
      maxLength: 200,
      placeholder: "Ex.: Auditório, quadra ou Bloco A",
    },
  ];

  return (
    <section
      aria-labelledby="event-form-title"
      className="event-form-shell mt-6 overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="event-form-heading border-b border-border bg-success-surface/60 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Autorização antecipada
        </p>
        <h2
          className="mt-3 font-display text-2xl text-ink"
          id="event-form-title"
          ref={titleRef}
          tabIndex={-1}
        >
          {event ? "Editar autorização" : "Nova autorização de evento"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
          A autorização apoia a conferência. Cada entrada continua sendo
          registrada separadamente na portaria.
        </p>
      </div>
      <form
        className="event-form-body space-y-6 p-5 sm:p-7"
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
                  className="flex items-center gap-2 text-sm font-semibold text-ink"
                  htmlFor={field.id}
                >
                  <Icon className="text-primary" name={field.icon} size={17} />
                  {field.label}
                </label>
                <input
                  aria-describedby={message ? errorId : undefined}
                  aria-invalid={Boolean(message)}
                  className={fieldClass}
                  disabled={disabled}
                  id={field.id}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  {...register(field.key)}
                />
                <ErrorMessage id={errorId} message={message} />
              </div>
            );
          })}
          <div>
            <label
              className="flex items-center gap-2 text-sm font-semibold text-ink"
              htmlFor="event-start"
            >
              <Icon className="text-primary" name="calendar" size={17} />
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
              className="flex items-center gap-2 text-sm font-semibold text-ink"
              htmlFor="event-end"
            >
              <Icon className="text-primary" name="calendar" size={17} />
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
          <label className="flex min-h-20 items-start gap-3 self-end rounded-xl border border-border bg-surface-subtle/55 px-4 py-3 text-sm text-ink">
            <input
              className="peer sr-only"
              disabled={disabled}
              type="checkbox"
              {...register("overnightAllowed")}
            />
            <span
              aria-hidden="true"
              className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-border transition peer-checked:bg-primary peer-focus-visible:ring-3 peer-focus-visible:ring-focus peer-disabled:opacity-60 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-surface-raised after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"
            />
            <span>
              <strong className="block font-bold">Permitir pernoite</strong>
              <span className="mt-1 block text-xs leading-5 text-ink-soft">
                Autoriza a permanência dos veículos após o horário do evento.
              </span>
            </span>
          </label>
          <p
            className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-xs text-ink-soft md:col-span-3"
            id="event-period-hint"
          >
            <Icon className="shrink-0 text-primary" name="clock" size={16} />
            Informe o início e o fim usando a data e a hora locais do campus.
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
            className="flex items-center gap-2 text-sm font-semibold text-ink"
            htmlFor="event-notes"
          >
            <Icon className="text-primary" name="clipboard" size={17} />
            Observação{" "}
            <span className="font-normal text-ink-soft">(opcional)</span>
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
                  placeholder="Inclua orientações necessárias para a portaria."
                  {...register("notes")}
                />
                <ErrorMessage id="event-notes-error" message={message} />
              </>
            );
          })()}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button disabled={disabled} onClick={onCancel} variant="secondary">
            Fechar formulário
          </Button>
          <Button className="px-7" disabled={disabled} type="submit">
            {!disabled && (
              <Icon name={event ? "clipboard" : "plus"} size={18} />
            )}
            {disabled
              ? "Salvando…"
              : event
                ? "Salvar alterações"
                : "Criar autorização"}
          </Button>
        </div>
      </form>
    </section>
  );
}
