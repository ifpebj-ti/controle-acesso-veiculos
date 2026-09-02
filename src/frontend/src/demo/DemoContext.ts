import { createContext } from "react";

export type DemoProfile =
  "porteiro" | "vigilante" | "transporte" | "administrador";

export type DemoShift = "Manhã" | "Tarde" | "Noite";

export interface DemoRegisteredVehicle {
  label: string;
  plate: string;
}

export interface DemoAuthorizedPerson {
  id: string;
  name: string;
  category: "Servidor" | "Terceirizado" | "Cadastrado";
  registration: string;
  sector: string;
  active: boolean;
  vehicles: DemoRegisteredVehicle[];
}

export interface DemoAccessRecord {
  id: number;
  plate: string;
  driver: string;
  destination: string;
  type:
    | "Visitante"
    | "Serviço"
    | "Institucional"
    | "Servidor"
    | "Terceirizado"
    | "Cadastrado"
    | "Moto táxi";
  purpose: string;
  shift: DemoShift;
  authorizedPersonId?: string;
  documentType?: string;
  documentVerified?: boolean;
  vehicleVerified?: boolean;
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
  authorizedPersonId?: string;
  documentType?: string;
  documentVerified?: boolean;
  vehicleVerified?: boolean;
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

export const initialAuthorizedPeople: DemoAuthorizedPerson[] = [
  {
    active: true,
    category: "Servidor",
    id: "person-01",
    name: "Servidor demonstrativo 01",
    registration: "SIAPE-DEMO-01",
    sector: "Coordenação acadêmica",
    vehicles: [
      { label: "Automóvel cadastrado", plate: "DEM-5101" },
      { label: "Motocicleta cadastrada", plate: "DEM-5102" },
    ],
  },
  {
    active: true,
    category: "Servidor",
    id: "person-02",
    name: "Servidor demonstrativo 02",
    registration: "SIAPE-DEMO-02",
    sector: "Biblioteca",
    vehicles: [{ label: "Automóvel cadastrado", plate: "DEM-5201" }],
  },
  {
    active: true,
    category: "Terceirizado",
    id: "person-03",
    name: "Terceirizado demonstrativo 01",
    registration: "TERC-DEMO-01",
    sector: "Empresa prestadora demonstrativa",
    vehicles: [{ label: "Motocicleta cadastrada", plate: "DEM-5301" }],
  },
  {
    active: true,
    category: "Cadastrado",
    id: "person-04",
    name: "Pessoa cadastrada demonstrativa 01",
    registration: "CAD-DEMO-01",
    sector: "Comunidade autorizada",
    vehicles: [{ label: "Veículo previamente autorizado", plate: "DEM-5401" }],
  },
  {
    active: true,
    category: "Cadastrado",
    id: "person-05",
    name: "Motorista institucional demonstrativo 01",
    registration: "MOT-DEMO-01",
    sector: "Setor de Transporte",
    vehicles: [{ label: "Ônibus institucional IFPE-01", plate: "IFD-0101" }],
  },
];

export function shiftForDate(date = new Date()): DemoShift {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "Manhã";
  if (hour >= 12 && hour < 18) return "Tarde";
  return "Noite";
}

export const initialRecords: DemoAccessRecord[] = [
  {
    id: 1001,
    plate: "DEM-0101",
    driver: "Pessoa de demonstração 01",
    destination: "Bloco acadêmico",
    type: "Visitante",
    purpose: "Levar ou buscar estudante",
    shift: shiftForDate(new Date(minutesAgo(14))),
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
    shift: shiftForDate(new Date(minutesAgo(42))),
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
    shift: shiftForDate(new Date(minutesAgo(185))),
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
    shift: shiftForDate(new Date(yearsAgo(5, 2))),
    documentType: "Documento oficial com foto",
    documentVerified: true,
    entryAt: yearsAgo(5, 2),
    exitAt: new Date(
      new Date(yearsAgo(5, 2)).getTime() + 35 * 60_000,
    ).toISOString(),
  },
  {
    authorizedPersonId: "person-01",
    driver: "Servidor demonstrativo 01",
    entryAt: minutesAgo(25),
    id: 1005,
    plate: "DEM-5101",
    purpose: "Expediente no campus",
    shift: shiftForDate(new Date(minutesAgo(25))),
    type: "Servidor",
    vehicleVerified: true,
    destination: "Coordenação acadêmica",
  },
  {
    authorizedPersonId: "person-03",
    driver: "Terceirizado demonstrativo 01",
    entryAt: minutesAgo(310),
    exitAt: minutesAgo(250),
    id: 1006,
    plate: "DEM-5301",
    purpose: "Expediente no campus",
    shift: shiftForDate(new Date(minutesAgo(310))),
    type: "Terceirizado",
    vehicleVerified: true,
    destination: "Empresa prestadora demonstrativa",
  },
  {
    driver: "Mototaxista demonstrativo 01",
    entryAt: minutesAgo(13),
    expectedExitAt: minutesAgo(3),
    id: 1007,
    plate: "DEM-5501",
    purpose: "Buscar passageiro",
    shift: shiftForDate(new Date(minutesAgo(13))),
    type: "Moto táxi",
    vehicleVerified: true,
    destination: "Área de embarque e desembarque",
  },
];

export type NewDemoAuthorizedPerson = Omit<
  DemoAuthorizedPerson,
  "active" | "id"
>;

export interface DemoContextValue {
  accountName: string;
  profile: DemoProfile;
  profileLabel: string;
  records: DemoAccessRecord[];
  authorizedPeople: DemoAuthorizedPerson[];
  notice: string | null;
  setDemoAccount: (profile: DemoProfile, accountName: string) => void;
  registerAccess: (record: NewDemoAccess) => void;
  closeAccess: (id: number) => void;
  addAuthorizedPerson: (person: NewDemoAuthorizedPerson) => void;
  toggleAuthorizedPerson: (id: string) => void;
  clearNotice: () => void;
}

export const DemoContext = createContext<DemoContextValue | null>(null);
