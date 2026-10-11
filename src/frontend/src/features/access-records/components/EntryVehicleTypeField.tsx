import { useRef } from "react";
import type {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetFocus,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import type { AccessEntryFormValues } from "../schemas/accessRecordSchemas";
import { customEntryOption, vehicleTypeOptions } from "../model/entryOptions";

interface EntryVehicleTypeFieldProps {
  clearErrors: UseFormClearErrors<AccessEntryFormValues>;
  control: Control<AccessEntryFormValues>;
  errors: FieldErrors<AccessEntryFormValues>;
  register: UseFormRegister<AccessEntryFormValues>;
  selectedVehicleType: AccessEntryFormValues["vehicleType"];
  setFocus: UseFormSetFocus<AccessEntryFormValues>;
}

export function EntryVehicleTypeField({
  clearErrors,
  control,
  errors,
  register,
  selectedVehicleType,
  setFocus,
}: EntryVehicleTypeFieldProps) {
  const focusCustomFieldOnClose = useRef(false);

  return (
    <div>
      <label className="text-sm font-semibold text-ink" htmlFor="vehicleType">
        Tipo do veículo{" "}
        <span className="font-normal text-ink-soft">(opcional)</span>
      </label>
      <Controller
        control={control}
        name="vehicleType"
        render={({ field }) => (
          <SelectField
            aria-describedby={
              errors.vehicleType ? "vehicleType-error" : undefined
            }
            aria-invalid={Boolean(errors.vehicleType)}
            className="mt-2"
            id="vehicleType"
            name={field.name}
            onBlur={field.onBlur}
            onCloseAutoFocus={(event) => {
              if (!focusCustomFieldOnClose.current) return;
              event.preventDefault();
              focusCustomFieldOnClose.current = false;
              setFocus("vehicleTypeOther");
            }}
            onValueChange={(value) => {
              clearErrors(["vehicleType", "vehicleTypeOther"]);
              focusCustomFieldOnClose.current =
                value === customEntryOption &&
                selectedVehicleType !== customEntryOption;
              field.onChange(value);
            }}
            options={[
              { label: "Não informado", value: "" },
              ...vehicleTypeOptions.map((option) => ({
                label: option,
                value: option,
              })),
            ]}
            value={field.value}
          />
        )}
      />
      {errors.vehicleType?.message && (
        <p className="mt-1.5 text-sm text-danger-text" id="vehicleType-error">
          {errors.vehicleType.message}
        </p>
      )}

      {selectedVehicleType === customEntryOption && (
        <div className="mt-4">
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="vehicleTypeOther"
          >
            Outro tipo de veículo <span className="text-danger-text">*</span>
          </label>
          <TextField
            aria-describedby={
              errors.vehicleTypeOther ? "vehicleTypeOther-error" : undefined
            }
            aria-invalid={Boolean(errors.vehicleTypeOther)}
            className="mt-2"
            id="vehicleTypeOther"
            maxLength={50}
            placeholder="Informe o tipo do veículo"
            {...register("vehicleTypeOther")}
          />
          {errors.vehicleTypeOther?.message && (
            <p
              className="mt-1.5 text-sm text-danger-text"
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
