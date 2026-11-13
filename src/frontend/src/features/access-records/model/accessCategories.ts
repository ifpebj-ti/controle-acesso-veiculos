export const generalAccessCategories = [
  "Visitante",
  "Prestador de serviço",
  "Entrega",
  "Evento",
  "Treino ou jogo",
  "Caminhada com veículo",
  "Mototáxi",
  "Permanência excepcional",
  "Outro acesso autorizado",
  "Aluno",
  "Terceirizado",
  "Federal",
] as const;

export type GeneralAccessCategory = (typeof generalAccessCategories)[number];

export function getAccessCategoryLabel(category: string) {
  return category === "Federal" ? "Servidor federal" : category;
}

export const generalAccessCategoryOptions = generalAccessCategories.map(
  (value) => ({
    label: getAccessCategoryLabel(value),
    value,
  }),
);

// Translate only the full display label; preserve partial search terms.
export function toAccessCategoryFilter(value: string) {
  const trimmed = value.trim();
  return trimmed.toLocaleLowerCase("pt-BR") === "servidor federal"
    ? "Federal"
    : trimmed;
}
