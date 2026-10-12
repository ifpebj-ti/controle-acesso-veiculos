import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import type { EventAuthorizationFormValues } from "../schemas/eventAuthorizationSchemas";
import type { EventAuthorizationServerErrors } from "../types";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-ink outline-none transition placeholder:text-ink-soft/75 focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:opacity-60";

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

function describedBy(...ids: Array<string | false | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
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
  const rulesMessage =
    typeof errors.vehicleRules?.message === "string"
      ? errors.vehicleRules.message
      : serverErrors.vehicleRules;

  function errorFor(
    index: number,
    field: "vehicleType" | "quantity" | "plate",
    localMessage?: string,
  ) {
    return (
      localMessage ??
      serverErrors[`vehicleRules.${index}.${field}`] ??
      serverErrors[`vehicleRules[${index}].${field}`]
    );
  }

  return (
    <fieldset
      aria-describedby={describedBy(
        "event-rules-hint",
        rulesMessage && "event-rules-error",
      )}
      aria-invalid={Boolean(rulesMessage)}
      className="event-rules-section rounded-2xl border border-border bg-surface-subtle/35 p-4 sm:p-5"
    >
      <legend className="px-2 text-lg font-bold text-ink">
        <span className="inline-flex items-center gap-2">
          <Icon className="text-primary" name="car" size={21} />
          Regras de veículos
        </span>
      </legend>
      <p className="mb-4 text-sm text-ink-soft" id="event-rules-hint">
        Use placa para um veículo específico ou cota para uma quantidade por
        tipo.
      </p>
      <div className="space-y-4">
        {fields.map((field, index) => {
          const ruleErrors = errors.vehicleRules?.[index];
          const mode = watchedRules?.[index]?.mode ?? "quota";
          const broadServerError = serverErrors[`vehicleRules[${index}]`];
          const broadErrorId = `event-rule-${index}-error`;
          const typeMessage = errorFor(
            index,
            "vehicleType",
            ruleErrors?.vehicleType?.message,
          );
          const quantityMessage = errorFor(
            index,
            "quantity",
            ruleErrors?.quantity?.message,
          );
          const plateMessage = errorFor(
            index,
            "plate",
            ruleErrors?.plate?.message,
          );

          return (
            <fieldset
              aria-describedby={broadServerError ? broadErrorId : undefined}
              aria-invalid={Boolean(broadServerError)}
              className="event-rule-card rounded-2xl border border-border bg-surface p-4"
              key={field.id}
            >
              <legend className="px-2 text-sm font-bold text-ink">
                <span className="inline-flex items-center gap-2">
                  <Icon className="text-primary" name="menu" size={16} />
                  Regra {index + 1}
                </span>
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["quota", "plate"] as const).map((value) => (
                  <label
                    className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                      mode === value
                        ? "border-primary bg-success-surface text-ink"
                        : "border-border bg-surface text-ink-soft hover:bg-primary/5"
                    }`}
                    key={value}
                  >
                    <input
                      aria-describedby={
                        broadServerError ? broadErrorId : undefined
                      }
                      aria-invalid={Boolean(broadServerError)}
                      disabled={disabled}
                      className="mt-1 size-4 accent-primary"
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
                    <span>
                      <strong className="block text-ink">
                        {value === "quota"
                          ? "Cota por tipo"
                          : "Placa específica"}
                      </strong>
                      <span className="mt-1 block text-xs leading-5">
                        {value === "quota"
                          ? "Defina uma quantidade por tipo de veículo."
                          : "Autorize um veículo específico pela placa."}
                      </span>
                    </span>
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
                    aria-describedby={describedBy(
                      typeMessage && `event-rule-${index}-type-error`,
                      broadServerError && broadErrorId,
                    )}
                    aria-invalid={Boolean(typeMessage || broadServerError)}
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
                    aria-describedby={describedBy(
                      quantityMessage && `event-rule-${index}-quantity-error`,
                      broadServerError && broadErrorId,
                    )}
                    aria-invalid={Boolean(quantityMessage || broadServerError)}
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
                      <span className="font-normal text-ink-soft">
                        (não se aplica)
                      </span>
                    )}
                  </label>
                  <input
                    aria-describedby={describedBy(
                      plateMessage && `event-rule-${index}-plate-error`,
                      broadServerError && broadErrorId,
                    )}
                    aria-invalid={Boolean(plateMessage || broadServerError)}
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
                <Button
                  disabled={disabled || fields.length === 1}
                  onClick={() => remove(index)}
                  variant="danger"
                >
                  <Icon name="x" size={16} />
                  Remover
                </Button>
              </div>
              <ErrorMessage id={broadErrorId} message={broadServerError} />
            </fieldset>
          );
        })}
      </div>
      <Button
        className="mt-4"
        disabled={disabled || fields.length >= 100}
        onClick={() =>
          append({ mode: "quota", plate: "", quantity: 1, vehicleType: "" })
        }
        variant="secondary"
      >
        <Icon name="plus" size={17} />
        Adicionar regra
      </Button>
      <ErrorMessage id="event-rules-error" message={rulesMessage} />
    </fieldset>
  );
}
