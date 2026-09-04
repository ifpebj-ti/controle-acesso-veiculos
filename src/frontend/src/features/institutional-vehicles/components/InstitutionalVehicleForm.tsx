import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import {
  institutionalVehicleFormSchema,
  type InstitutionalVehicleFormValues,
} from "../schemas/institutionalVehicleSchemas";
import type { InstitutionalVehicle, InstitutionalVehicleInput } from "../types";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

export type InstitutionalVehicleField = keyof InstitutionalVehicleFormValues;

interface InstitutionalVehicleFormProps {
  busy: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (input: InstitutionalVehicleInput) => Promise<void>;
  serverErrors: Partial<Record<InstitutionalVehicleField, string>>;
  vehicle?: InstitutionalVehicle;
}

function optionalValue(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

function initialValues(
  vehicle?: InstitutionalVehicle,
): InstitutionalVehicleFormValues {
  return {
    brand: vehicle?.brand ?? "",
    color: vehicle?.color ?? "",
    identification: vehicle?.identification ?? "",
    model: vehicle?.model ?? "",
    plate: vehicle?.plate ?? "",
    vehicleType: vehicle?.vehicleType ?? "",
    year: vehicle?.year?.toString() ?? "",
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-800">{message}</p>;
}

export function InstitutionalVehicleForm({
  busy,
  mode,
  onCancel,
  onSubmit,
  serverErrors,
  vehicle,
}: InstitutionalVehicleFormProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<InstitutionalVehicleFormValues>({
    defaultValues: initialValues(vehicle),
    resolver: zodResolver(institutionalVehicleFormSchema),
  });

  const disabled = busy || isSubmitting;

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function submit(values: InstitutionalVehicleFormValues) {
    await onSubmit({
      brand: optionalValue(values.brand),
      color: optionalValue(values.color),
      identification: optionalValue(values.identification),
      model: optionalValue(values.model),
      plate: optionalValue(values.plate),
      vehicleType: optionalValue(values.vehicleType),
      year: values.year ? Number(values.year) : null,
    });
  }

  function errorFor(field: InstitutionalVehicleField) {
    return errors[field]?.message ?? serverErrors[field];
  }

  return (
    <section
      aria-labelledby="vehicle-form-title"
      className="mt-6 overflow-hidden rounded-[2rem] border border-brand-dark/15 bg-white shadow-[0_14px_40px_rgba(1,36,40,0.07)]"
    >
      <div className="border-b border-ink/8 bg-brand-soft/30 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Manutenção autorizada
        </p>
        <h2
          className="mt-1 font-display text-2xl text-ink"
          id="vehicle-form-title"
          ref={titleRef}
          tabIndex={-1}
        >
          {mode === "create" ? "Cadastrar veículo" : "Editar veículo"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">
          Informe ao menos a placa ou a identificação institucional. Os demais
          campos ajudam a equipe a conferir o veículo correto.
        </p>
      </div>

      <form
        className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="fleet-plate"
          >
            Placa
          </label>
          <input
            aria-invalid={Boolean(errorFor("plate"))}
            autoCapitalize="characters"
            className={fieldClass}
            id="fleet-plate"
            maxLength={10}
            placeholder="Ex.: DEM-1A23"
            {...register("plate")}
          />
          <FieldError message={errorFor("plate")} />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="fleet-identification"
          >
            Identificação institucional
          </label>
          <input
            aria-invalid={Boolean(errorFor("identification"))}
            className={fieldClass}
            id="fleet-identification"
            maxLength={100}
            placeholder="Ex.: VEÍCULO 01"
            {...register("identification")}
          />
          <FieldError message={errorFor("identification")} />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="fleet-type"
          >
            Tipo <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <input
            aria-invalid={Boolean(errorFor("vehicleType"))}
            className={fieldClass}
            id="fleet-type"
            maxLength={50}
            placeholder="Ex.: Automóvel"
            {...register("vehicleType")}
          />
          <FieldError message={errorFor("vehicleType")} />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="fleet-brand"
          >
            Marca <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <input
            aria-invalid={Boolean(errorFor("brand"))}
            className={fieldClass}
            id="fleet-brand"
            maxLength={80}
            {...register("brand")}
          />
          <FieldError message={errorFor("brand")} />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="fleet-model"
          >
            Modelo <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <input
            aria-invalid={Boolean(errorFor("model"))}
            className={fieldClass}
            id="fleet-model"
            maxLength={100}
            {...register("model")}
          />
          <FieldError message={errorFor("model")} />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="fleet-color"
          >
            Cor <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <input
            aria-invalid={Boolean(errorFor("color"))}
            className={fieldClass}
            id="fleet-color"
            maxLength={40}
            {...register("color")}
          />
          <FieldError message={errorFor("color")} />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="fleet-year"
          >
            Ano <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <input
            aria-invalid={Boolean(errorFor("year"))}
            className={fieldClass}
            id="fleet-year"
            inputMode="numeric"
            maxLength={4}
            placeholder="Ex.: 2024"
            {...register("year")}
          />
          <FieldError message={errorFor("year")} />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-3">
          <button
            className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
            disabled={disabled}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="min-h-12 rounded-xl bg-brand px-7 font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30 disabled:cursor-wait disabled:opacity-65"
            disabled={disabled}
            type="submit"
          >
            {disabled
              ? "Salvando…"
              : mode === "create"
                ? "Cadastrar veículo"
                : "Salvar alterações"}
          </button>
        </div>
      </form>
    </section>
  );
}
