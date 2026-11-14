import {
  isValidVehiclePlate,
  normalizeVehiclePlate,
} from "../../vehicle-plates/vehiclePlate";
export interface VehicleDraft {
  plate: string;
  vehicleType: string;
  otherVehicleType: string;
}
export const emptyVehicle: VehicleDraft = {
  plate: "",
  vehicleType: "",
  otherVehicleType: "",
};
export function vehicleInput(draft: VehicleDraft) {
  return {
    plate: normalizeVehiclePlate(draft.plate),
    vehicleType: (draft.vehicleType === "Outro"
      ? draft.otherVehicleType
      : draft.vehicleType
    ).trim(),
  };
}
export function vehicleErrors(draft: VehicleDraft) {
  const input = vehicleInput(draft);
  return {
    ...(!isValidVehiclePlate(input.plate)
      ? { plate: "Informe uma placa no formato ABC-1234 ou ABC1D23." }
      : {}),
    ...(!input.vehicleType
      ? { vehicleType: "Informe o tipo do veículo." }
      : {}),
  };
}
