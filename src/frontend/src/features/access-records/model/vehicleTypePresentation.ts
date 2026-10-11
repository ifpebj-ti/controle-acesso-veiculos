import type { IconName } from "../../../components/ui/Icon";

export interface VehiclePresentation {
  icon: IconName;
  kind: string;
  label: string;
}

export function getVehiclePresentation(
  vehicleType?: string | null,
): VehiclePresentation {
  const label = vehicleType?.trim() || "Não informado";
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

  if (normalized.includes("moto")) {
    return { icon: "motorcycle", kind: "motorcycle", label };
  }
  if (normalized.includes("micro-onibus") || normalized.includes("onibus")) {
    return { icon: "bus", kind: "bus", label };
  }
  if (normalized.includes("caminhonete")) {
    return { icon: "pickup", kind: "pickup", label };
  }
  if (normalized.includes("caminhao")) {
    return { icon: "truck", kind: "truck", label };
  }
  if (normalized.includes("van")) {
    return { icon: "van", kind: "van", label };
  }
  if (normalized.includes("emergencia")) {
    return { icon: "ambulance", kind: "emergency", label };
  }
  if (normalized.includes("automovel") || normalized.includes("carro")) {
    return { icon: "car", kind: "car", label };
  }

  return { icon: "vehicle", kind: "unknown", label };
}
