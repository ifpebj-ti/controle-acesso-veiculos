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
