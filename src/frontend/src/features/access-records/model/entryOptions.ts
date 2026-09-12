export const quickAccessObjectives = [
  "Atendimento em setor",
  "Reunião",
  "Entrega ou retirada de material",
  "Serviço ou manutenção",
  "Participação em atividade",
  "Embarque ou desembarque",
  "Outro",
] as const;

export const vehicleTypeOptions = [
  "Automóvel",
  "Motocicleta",
  "Caminhonete",
  "Van",
  "Micro-ônibus",
  "Ônibus",
  "Caminhão",
  "Veículo de emergência",
  "Outro",
] as const;

export const customEntryOption = "Outro";

export type QuickAccessObjective = (typeof quickAccessObjectives)[number];
export type VehicleTypeOption = (typeof vehicleTypeOptions)[number];
