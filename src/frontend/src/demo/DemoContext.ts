import { createContext } from 'react';

export type DemoProfile =
  | 'porteiro'
  | 'vigilante'
  | 'transporte'
  | 'administrador';

export interface DemoAccessRecord {
  id: number;
  plate: string;
  driver: string;
  destination: string;
  type: 'Visitante' | 'Serviço' | 'Institucional';
  entryAt: string;
  exitAt?: string;
}

export interface NewDemoAccess {
  plate: string;
  driver: string;
  destination: string;
  type: DemoAccessRecord['type'];
}

export const profileLabels: Record<DemoProfile, string> = {
  administrador: 'Administrador',
  porteiro: 'Porteiro',
  transporte: 'Setor de Transporte',
  vigilante: 'Vigilante',
};

export const initialRecords: DemoAccessRecord[] = [
  {
    id: 1001,
    plate: 'DEM-0101',
    driver: 'Pessoa de demonstração 01',
    destination: 'Setor administrativo',
    type: 'Visitante',
    entryAt: '2026-08-31T08:12:00-03:00',
  },
  {
    id: 1002,
    plate: 'DEM-0202',
    driver: 'Pessoa de demonstração 02',
    destination: 'Manutenção',
    type: 'Serviço',
    entryAt: '2026-08-31T09:40:00-03:00',
  },
  {
    id: 1003,
    plate: 'IFD-0303',
    driver: 'Motorista institucional 01',
    destination: 'Campus Pesqueira',
    type: 'Institucional',
    entryAt: '2026-08-31T06:25:00-03:00',
    exitAt: '2026-08-31T07:05:00-03:00',
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
