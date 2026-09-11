import { useEffect, useRef } from "react";
import type {
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
} from "react-hook-form";

import type { AccessEntryFormValues } from "../schemas/accessRecordSchemas";
import { customEntryOption, vehicleTypeOptions } from "../model/entryOptions";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

interface EntryVehicleTypeFieldProps {
  clearErrors: UseFormClearErrors<AccessEntryFormValues>;
  errors: FieldErrors<AccessEntryFormValues>;
  register: UseFormRegister<AccessEntryFormValues>;
  selectedVehicleType: AccessEntryFormValues["vehicleType"];
}

export function EntryVehicleTypeField({
  clearErrors,
  errors,
  register,
  selectedVehicleType,
}: EntryVehicleTypeFieldProps) {
  const previousVehicleType = useRef(selectedVehicleType);

  useEffect(() => {
    if (selectedVehicleType !== previousVehicleType.current) {
      clearErrors(["vehicleType", "vehicleTypeOther"]);
    }
    if (
      selectedVehicleType === customEntryOption &&
      previousVehicleType.current !== customEntryOption
    ) {
      window.requestAnimationFrame(() =>
        document.getElementById("vehicleTypeOther")?.focus(),
      );
    }
    previousVehicleType.current = selectedVehicleType;
  }, [clearErrors, selectedVehicleType]);

  return (
    <div>
      <label className="text-sm font-semibold text-ink" htmlFor="vehicleType">
        Tipo do veículo{" "}
        <span className="font-normal text-ink/50">(opcional)</span>
      </label>
      <select
        aria-describedby={errors.vehicleType ? "vehicleType-error" : undefined}
        aria-invalid={Boolean(errors.vehicleType)}
        className={fieldClass}
        id="vehicleType"
        {...register("vehicleType")}
      >
        <option value="">Não informado</option>
        {vehicleTypeOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {errors.vehicleType?.message && (
        <p className="mt-1.5 text-sm text-red-800" id="vehicleType-error">
          {errors.vehicleType.message}
        </p>
      )}

      {selectedVehicleType === customEntryOption && (
        <div className="mt-4">
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="vehicleTypeOther"
          >
            Outro tipo de veículo <span className="text-red-700">*</span>
          </label>
          <input
            aria-describedby={
              errors.vehicleTypeOther ? "vehicleTypeOther-error" : undefined
            }
            aria-invalid={Boolean(errors.vehicleTypeOther)}
            className={fieldClass}
            id="vehicleTypeOther"
            maxLength={50}
            placeholder="Informe o tipo do veículo"
            {...register("vehicleTypeOther")}
          />
          {errors.vehicleTypeOther?.message && (
            <p
              className="mt-1.5 text-sm text-red-800"
              id="vehicleTypeOther-error"
            >
              {errors.vehicleTypeOther.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
