import { createContext } from "react";

export type DemoProfile =
  "porteiro" | "vigilante" | "transporte" | "administrador";

export interface DemoAccessRecord {
  id: number;
  plate: string;
  driver: string;
  destination: string;
  type: "Visitante" | "Serviço" | "Institucional";
  purpose: string;
  documentType?: string;
  documentVerified?: boolean;
  expectedExitAt?: string;
  institutionalVehicleCode?: string;
  entryAt: string;
  exitAt?: string;
}

export interface NewDemoAccess {
  plate: string;
  driver: string;
  destination: string;
  type: DemoAccessRecord["type"];
  purpose: string;
  documentType?: string;
  documentVerified?: boolean;
  expectedDurationMinutes?: number;
  institutionalVehicleCode?: string;
}

export interface DemoInstitutionalVehicle {
  code: string;
  label: string;
  plate: string;
  status: "Disponível" | "Em viagem" | "Manutenção";
}

export const profileLabels: Record<DemoProfile, string> = {
  administrador: "Administrador",
  porteiro: "Porteiro",
  transporte: "Setor de Transporte",
  vigilante: "Vigilante",
};

const demoNow = Date.now();
const minutesAgo = (minutes: number) =>
  new Date(demoNow - minutes * 60_000).toISOString();
const yearsAgo = (years: number, extraDays = 0) => {
  const date = new Date(demoNow - extraDays * 86_400_000);
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString();
};

export const institutionalVehicles: DemoInstitutionalVehicle[] = [
  {
    code: "IFPE-01",
    label: "Ônibus institucional",
    plate: "IFD-0101",
    status: "Disponível",
  },
  {
    code: "IFPE-02",
    label: "Van institucional",
    plate: "IFD-0202",
    status: "Em viagem",
  },
  {
    code: "IFPE-03",
    label: "Veículo de apoio",
    plate: "IFD-0303",
    status: "Manutenção",
  },
];

export const initialRecords: DemoAccessRecord[] = [
  {
    id: 1001,
    plate: "DEM-0101",
    driver: "Pessoa de demonstração 01",
    destination: "Bloco acadêmico",
    type: "Visitante",
    purpose: "Levar ou buscar estudante",
    documentType: "Documento oficial com foto",
    documentVerified: true,
    entryAt: minutesAgo(14),
    expectedExitAt: minutesAgo(4),
  },
  {
    id: 1002,
    plate: "DEM-0202",
    driver: "Pessoa de demonstração 02",
    destination: "Manutenção",
    type: "Serviço",
    purpose: "Prestação de serviço autorizada",
    documentType: "Documento funcional",
    documentVerified: true,
    entryAt: minutesAgo(42),
  },
  {
    id: 1003,
    plate: "IFD-0303",
    driver: "Motorista institucional 01",
    destination: "Campus Pesqueira",
    type: "Institucional",
    purpose: "Deslocamento institucional",
    institutionalVehicleCode: "IFPE-03",
    entryAt: minutesAgo(185),
    exitAt: minutesAgo(145),
  },
  {
    id: 1004,
    plate: "DEM-0404",
    driver: "Pessoa de demonstração histórica",
    destination: "Setor de atendimento",
    type: "Visitante",
    purpose: "Atendimento agendado",
    documentType: "Documento oficial com foto",
    documentVerified: true,
    entryAt: yearsAgo(5, 2),
    exitAt: new Date(
      new Date(yearsAgo(5, 2)).getTime() + 35 * 60_000,
    ).toISOString(),
  },
];

export interface DemoContextValue {
  accountName: string;
  profile: DemoProfile;
  profileLabel: string;
  records: DemoAccessRecord[];
  notice: string | null;
  setDemoAccount: (profile: DemoProfile, accountName: string) => void;
  registerAccess: (record: NewDemoAccess) => void;
  closeAccess: (id: number) => void;
  clearNotice: () => void;
}

export const DemoContext = createContext<DemoContextValue | null>(null);
