import { useId } from "react";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { vehicleTypeOptions } from "../../access-records/model/entryOptions";
import {
  formatVehiclePlateInput,
  vehiclePlateFormatHint,
} from "../../vehicle-plates/vehiclePlate";

import type { VehicleDraft } from "../model/campusVehicleForm";
interface Props {
  value: VehicleDraft;
  onChange: (draft: VehicleDraft) => void;
  errors: Record<string, string | undefined>;
  disabled?: boolean;
}
export function CampusVehicleFields({
  value,
  onChange,
  errors,
  disabled,
}: Props) {
  const id = useId();
  return (
    <>
      <div className="min-w-0">
        <label className="block text-sm font-semibold" htmlFor={`${id}-plate`}>
          Placa do veículo
        </label>
        <TextField
          aria-describedby={`${id}-plate-hint${errors.plate ? ` ${id}-plate-error` : ""}`}
          aria-invalid={Boolean(errors.plate)}
          className="mt-2 w-full"
          disabled={disabled}
          id={`${id}-plate`}
          maxLength={10}
          onChange={(event) =>
            onChange({
              ...value,
              plate: formatVehiclePlateInput(event.target.value),
            })
          }
          required
          value={value.plate}
        />
        <p className="mt-2 text-sm text-text-muted" id={`${id}-plate-hint`}>
          {vehiclePlateFormatHint}
        </p>
        {errors.plate && (
          <p
            className="mt-2 text-sm text-danger-text"
            id={`${id}-plate-error`}
            role="alert"
          >
            {errors.plate}
          </p>
        )}
      </div>
      <div className="min-w-0">
        <label className="block text-sm font-semibold" htmlFor={`${id}-type`}>
          Tipo do veículo
        </label>
        <SelectField
          aria-describedby={errors.vehicleType ? `${id}-type-error` : undefined}
          aria-invalid={Boolean(errors.vehicleType)}
          className="mt-2 w-full"
          disabled={disabled}
          id={`${id}-type`}
          onValueChange={(vehicleType) => onChange({ ...value, vehicleType })}
          options={vehicleTypeOptions.map((type) => ({
            label: type,
            value: type,
          }))}
          placeholder="Selecione o tipo"
          required
          value={value.vehicleType}
        />
        {value.vehicleType === "Outro" && (
          <div className="mt-3">
            <label
              className="block text-sm font-semibold"
              htmlFor={`${id}-other`}
            >
              Outro tipo de veículo
            </label>
            <TextField
              className="mt-2 w-full"
              disabled={disabled}
              id={`${id}-other`}
              maxLength={50}
              onChange={(event) =>
                onChange({ ...value, otherVehicleType: event.target.value })
              }
              required
              value={value.otherVehicleType}
            />
          </div>
        )}
        {errors.vehicleType && (
          <p
            className="mt-2 text-sm text-danger-text"
            id={`${id}-type-error`}
            role="alert"
          >
            {errors.vehicleType}
          </p>
        )}
      </div>
    </>
  );
}
