import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import type { InstitutionalDriver } from "../../institutional-drivers";
import type { InstitutionalVehicle } from "../../institutional-vehicles";
import {
  institutionalDepartureFormSchema,
  type InstitutionalDepartureFormValues,
} from "../schemas/institutionalUsageSchemas";
import type {
  InstitutionalDepartureInput,
  InstitutionalUsageServerErrors,
} from "../types";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20 disabled:opacity-60";

interface InstitutionalDepartureFormProps {
  busy: boolean;
  drivers: InstitutionalDriver[];
  onCancel: () => void;
  onSubmit: (input: InstitutionalDepartureInput) => Promise<void>;
  serverErrors: InstitutionalUsageServerErrors;
  vehicles: InstitutionalVehicle[];
}

function vehicleLabel(vehicle: InstitutionalVehicle) {
  const identity =
    vehicle.plate ?? vehicle.identification ?? `Veículo ${vehicle.id}`;
  const description = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
  return description ? `${identity} — ${description}` : identity;
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="mt-1.5 text-sm text-red-800" id={id}>
      {message}
    </p>
  ) : null;
}

export function InstitutionalDepartureForm({
  busy,
  drivers,
  onCancel,
  onSubmit,
  serverErrors,
  vehicles,
}: InstitutionalDepartureFormProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<InstitutionalDepartureFormValues>({
    defaultValues: {
      departureMileage: 0,
      driverId: 0,
      itinerary: "",
      vehicleId: 0,
    },
    resolver: zodResolver(institutionalDepartureFormSchema),
  });
  const disabled = busy || isSubmitting;
  const vehicleError =
    errors.vehicleId?.message ?? serverErrors.vehicleId ?? serverErrors.vehicle;
  const driverError = errors.driverId?.message ?? serverErrors.driverId;
  const mileageError =
    errors.departureMileage?.message ?? serverErrors.departureMileage;
  const itineraryError = errors.itinerary?.message ?? serverErrors.itinerary;

  useEffect(() => titleRef.current?.focus(), []);

  async function submit(values: InstitutionalDepartureFormValues) {
    await onSubmit({
      departureMileage: values.departureMileage,
      driverId: values.driverId,
      itinerary: values.itinerary.trim(),
      vehicleId: values.vehicleId,
    });
  }

  return (
    <section
      aria-labelledby="institutional-departure-title"
      className="mt-6 overflow-hidden rounded-[2rem] border border-brand-dark/15 bg-white shadow-[0_14px_40px_rgba(1,36,40,0.07)]"
    >
      <div className="border-b border-ink/8 bg-brand-soft/30 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Movimentação da frota
        </p>
        <h2
          className="mt-1 font-display text-2xl text-ink"
          id="institutional-departure-title"
          ref={titleRef}
          tabIndex={-1}
        >
          Registrar saída institucional
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">
          Selecione somente veículos e motoristas previamente autorizados. O
          horário oficial será registrado pelo servidor.
        </p>
      </div>
      <form
        className="grid gap-5 p-5 sm:p-7 lg:grid-cols-2"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        {(vehicles.length === 0 || drivers.length === 0) && (
          <p
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 lg:col-span-2"
            role="status"
          >
            Para registrar uma saída, é necessário ter ao menos um veículo e um
            motorista ativos nos catálogos institucionais.
          </p>
        )}
        <div>
          <label className="text-sm font-semibold" htmlFor="usage-vehicle">
            Veículo institucional
          </label>
          <select
            aria-describedby={vehicleError ? "usage-vehicle-error" : undefined}
            aria-invalid={Boolean(vehicleError)}
            className={fieldClass}
            disabled={disabled}
            id="usage-vehicle"
            {...register("vehicleId")}
          >
            <option value={0}>Selecione um veículo</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicleLabel(vehicle)}
              </option>
            ))}
          </select>
          <ErrorMessage id="usage-vehicle-error" message={vehicleError} />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="usage-driver">
            Motorista autorizado
          </label>
          <select
            aria-describedby={driverError ? "usage-driver-error" : undefined}
            aria-invalid={Boolean(driverError)}
            className={fieldClass}
            disabled={disabled}
            id="usage-driver"
            {...register("driverId")}
          >
            <option value={0}>Selecione um motorista</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.personId}>
                {driver.name}
              </option>
            ))}
          </select>
          <ErrorMessage id="usage-driver-error" message={driverError} />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="usage-mileage">
            Quilometragem de saída
          </label>
          <input
            aria-describedby={mileageError ? "usage-mileage-error" : undefined}
            aria-invalid={Boolean(mileageError)}
            className={fieldClass}
            disabled={disabled}
            id="usage-mileage"
            min={0}
            type="number"
            {...register("departureMileage")}
          />
          <ErrorMessage id="usage-mileage-error" message={mileageError} />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="usage-itinerary">
            Itinerário
          </label>
          <input
            aria-describedby={
              itineraryError ? "usage-itinerary-error" : undefined
            }
            aria-invalid={Boolean(itineraryError)}
            className={fieldClass}
            disabled={disabled}
            id="usage-itinerary"
            maxLength={500}
            placeholder="Ex.: Campus — destino fictício"
            {...register("itinerary")}
          />
          <ErrorMessage id="usage-itinerary-error" message={itineraryError} />
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end lg:col-span-2">
          <button
            className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold disabled:opacity-60"
            disabled={disabled}
            onClick={onCancel}
            type="button"
          >
            Fechar formulário
          </button>
          <button
            className="min-h-12 rounded-xl bg-brand px-7 font-bold text-white disabled:cursor-wait disabled:opacity-65"
            disabled={disabled || vehicles.length === 0 || drivers.length === 0}
            type="submit"
          >
            {disabled ? "Registrando…" : "Registrar saída"}
          </button>
        </div>
      </form>
    </section>
  );
}
