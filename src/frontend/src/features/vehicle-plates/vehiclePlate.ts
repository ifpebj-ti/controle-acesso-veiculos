export const vehiclePlateFormatError =
  "Informe uma placa no formato ABC-1234 ou ABC1D23.";

export const vehiclePlateFormatHint =
  "Use ABC-1234 (padrão antigo) ou ABC1D23 (Mercosul).";

const legacyPlatePattern = /^[A-Z]{3}[0-9]{4}$/;
const mercosurPlatePattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export function normalizeVehiclePlate(value: string) {
  return value.replace(/[-\s]/gu, "").toUpperCase();
}

export function isValidVehiclePlate(value: string) {
  const normalized = normalizeVehiclePlate(value);
  return (
    legacyPlatePattern.test(normalized) || mercosurPlatePattern.test(normalized)
  );
}

export function formatVehiclePlateInput(value: string) {
  const normalized = normalizeVehiclePlate(value);
  return legacyPlatePattern.test(normalized)
    ? `${normalized.slice(0, 3)}-${normalized.slice(3)}`
    : normalized;
}
