import type { EventParkingLocation } from "../types";

export const eventParkingLocationOptions: Array<{
  label: string;
  value: EventParkingLocation;
}> = [
  { label: "A definir", value: "ADefinir" },
  { label: "Interno", value: "Interno" },
  { label: "Externo", value: "Externo" },
];

export function eventParkingLocationLabel(value: EventParkingLocation) {
  return (
    eventParkingLocationOptions.find((option) => option.value === value)
      ?.label ?? value
  );
}
