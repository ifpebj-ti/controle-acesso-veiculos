import { createContext } from "react";

import type { GeneralAccessCategory } from "../features/access-records/model/accessCategories";

export interface DemoAccessRecord {
  id: number;
  plate: string;
  driver: string;
  category: GeneralAccessCategory;
  objective: string;
  vehicleType?: string;
  observation?: string;
  entryAt: string;
  exitAt?: string;
}

export interface NewDemoAccess {
  plate: string;
  driver: string;
  category: GeneralAccessCategory;
  objective: string;
  vehicleType?: string;
  observation?: string;
}

export interface DemoInstitutionalVehicle {
  code: string;
  label: string;
  plate: string;
  status: "Disponível" | "Em viagem" | "Manutenção";
}

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
    category: "Visitante",
    objective: "Atendimento no bloco acadêmico",
    vehicleType: "Automóvel",
    entryAt: minutesAgo(14),
  },
  {
    id: 1002,
    plate: "DEM-0202",
    driver: "Pessoa de demonstração 02",
    category: "Prestador de serviço",
    objective: "Manutenção preventiva autorizada",
    vehicleType: "Utilitário",
    entryAt: minutesAgo(42),
  },
  {
    id: 1003,
    plate: "DEM-0303",
    driver: "Pessoa de demonstração 03",
    category: "Entrega",
    objective: "Entrega de material ao almoxarifado",
    vehicleType: "Furgão",
    entryAt: minutesAgo(185),
    exitAt: minutesAgo(145),
  },
  {
    id: 1004,
    plate: "DEM-0404",
    driver: "Pessoa de demonstração histórica",
    category: "Visitante",
    objective: "Atendimento agendado",
    vehicleType: "Automóvel",
    entryAt: yearsAgo(5, 2),
    exitAt: new Date(
      new Date(yearsAgo(5, 2)).getTime() + 35 * 60_000,
    ).toISOString(),
  },
];

export interface DemoContextValue {
  records: DemoAccessRecord[];
  notice: string | null;
  registerAccess: (record: NewDemoAccess) => void;
  closeAccess: (id: number) => void;
  clearNotice: () => void;
}

export const DemoContext = createContext<DemoContextValue | null>(null);
