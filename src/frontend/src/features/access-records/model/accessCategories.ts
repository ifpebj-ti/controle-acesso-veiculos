export const generalAccessCategories = [
  "Visitante",
  "Prestador de serviço",
  "Entrega",
  "Evento",
  "Outro acesso autorizado",
] as const;

export type GeneralAccessCategory = (typeof generalAccessCategories)[number];
