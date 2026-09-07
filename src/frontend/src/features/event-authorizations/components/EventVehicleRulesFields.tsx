import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import type { EventAuthorizationFormValues } from "../schemas/eventAuthorizationSchemas";
import type { EventAuthorizationServerErrors } from "../types";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20 disabled:opacity-60";

interface EventVehicleRulesFieldsProps {
  control: Control<EventAuthorizationFormValues>;
  disabled: boolean;
  errors: FieldErrors<EventAuthorizationFormValues>;
  register: UseFormRegister<EventAuthorizationFormValues>;
  serverErrors: EventAuthorizationServerErrors;
  setValue: UseFormSetValue<EventAuthorizationFormValues>;
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="mt-1.5 text-sm text-red-800" id={id}>
      {message}
    </p>
  ) : null;
}

export function EventVehicleRulesFields({
  control,
  disabled,
  errors,
  register,
  serverErrors,
  setValue,
}: EventVehicleRulesFieldsProps) {
  const { append, fields, remove } = useFieldArray({
    control,
    name: "vehicleRules",
  });
  const watchedRules = useWatch({ control, name: "vehicleRules" });
  const errorFor = (field: string, localMessage?: string) =>
    localMessage ?? serverErrors[field];

  return (
    <fieldset className="rounded-2xl border border-ink/10 bg-cream/25 p-4 sm:p-5">
      <legend className="px-2 text-lg font-bold text-ink">
        Regras de veículos
      </legend>
      <p className="mb-4 text-sm text-ink/65">
        Use placa para um veículo específico ou cota para uma quantidade por
        tipo.
      </p>
      <div className="space-y-4">
        {fields.map((field, index) => {
          const ruleErrors = errors.vehicleRules?.[index];
          const mode = watchedRules?.[index]?.mode ?? "quota";
          const prefix = `vehicleRules.${index}`;
          const broadServerError = serverErrors[`vehicleRules[${index}]`];
          const typeMessage =
            errorFor(
              `${prefix}.vehicleType`,
              ruleErrors?.vehicleType?.message,
            ) ?? broadServerError;
          const quantityMessage = errorFor(
            `${prefix}.quantity`,
            ruleErrors?.quantity?.message,
          );
          const plateMessage =
            errorFor(`${prefix}.plate`, ruleErrors?.plate?.message) ??
            broadServerError;

          return (
            <fieldset
              className="rounded-2xl border border-ink/10 bg-white p-4"
              key={field.id}
            >
              <legend className="px-2 text-sm font-bold">
                Regra {index + 1}
              </legend>
              <div className="flex flex-wrap gap-5">
                {(["quota", "plate"] as const).map((value) => (
                  <label
                    className="flex min-h-10 items-center gap-2 text-sm font-semibold"
                    key={value}
                  >
                    <input
                      disabled={disabled}
                      type="radio"
                      value={value}
                      {...register(`vehicleRules.${index}.mode`, {
                        onChange: () => {
                          if (value === "plate") {
                            setValue(`vehicleRules.${index}.quantity`, 1);
                          }
                        },
                      })}
                    />
                    {value === "quota" ? "Cota por tipo" : "Placa específica"}
                  </label>
                ))}
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-[1fr_.55fr_1fr_auto] md:items-end">
                <div>
                  <label
                    className="text-sm font-semibold"
                    htmlFor={`event-rule-${index}-type`}
                  >
                    Tipo do veículo
                  </label>
                  <input
                    aria-describedby={
                      typeMessage ? `event-rule-${index}-type-error` : undefined
                    }
                    aria-invalid={Boolean(typeMessage)}
                    className={fieldClass}
                    disabled={disabled}
                    id={`event-rule-${index}-type`}
                    maxLength={50}
                    placeholder="Ex.: Automóvel"
                    {...register(`vehicleRules.${index}.vehicleType`)}
                  />
                  <ErrorMessage
                    id={`event-rule-${index}-type-error`}
                    message={typeMessage}
                  />
                </div>
                <div>
                  <label
                    className="text-sm font-semibold"
                    htmlFor={`event-rule-${index}-quantity`}
                  >
                    Quantidade
                  </label>
                  <input
                    aria-describedby={
                      quantityMessage
                        ? `event-rule-${index}-quantity-error`
                        : undefined
                    }
                    aria-invalid={Boolean(quantityMessage)}
                    className={fieldClass}
                    disabled={disabled || mode === "plate"}
                    id={`event-rule-${index}-quantity`}
                    max={1000}
                    min={1}
                    type="number"
                    {...register(`vehicleRules.${index}.quantity`)}
                  />
                  <ErrorMessage
                    id={`event-rule-${index}-quantity-error`}
                    message={quantityMessage}
                  />
                </div>
                <div>
                  <label
                    className="text-sm font-semibold"
                    htmlFor={`event-rule-${index}-plate`}
                  >
                    Placa{" "}
                    {mode === "quota" && (
                      <span className="font-normal text-ink/50">
                        (não se aplica)
                      </span>
                    )}
                  </label>
                  <input
                    aria-describedby={
                      plateMessage
                        ? `event-rule-${index}-plate-error`
                        : undefined
                    }
                    aria-invalid={Boolean(plateMessage)}
                    className={fieldClass}
                    disabled={disabled || mode === "quota"}
                    id={`event-rule-${index}-plate`}
                    maxLength={10}
                    placeholder="Ex.: ABC1D23"
                    {...register(`vehicleRules.${index}.plate`)}
                  />
                  <ErrorMessage
                    id={`event-rule-${index}-plate-error`}
                    message={plateMessage}
                  />
                </div>
                <button
                  className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-800 disabled:opacity-45"
                  disabled={disabled || fields.length === 1}
                  onClick={() => remove(index)}
                  type="button"
                >
                  Remover
                </button>
              </div>
            </fieldset>
          );
        })}
      </div>
      <button
        className="mt-4 min-h-11 rounded-xl border border-brand-dark/25 px-4 text-sm font-bold text-brand-dark disabled:opacity-60"
        disabled={disabled || fields.length >= 100}
        onClick={() =>
          append({ mode: "quota", plate: "", quantity: 1, vehicleType: "" })
        }
        type="button"
      >
        Adicionar regra
      </button>
      <ErrorMessage
        id="event-rules-error"
        message={
          typeof errors.vehicleRules?.message === "string"
            ? errors.vehicleRules.message
            : serverErrors.vehicleRules
        }
      />
    </fieldset>
  );
}
