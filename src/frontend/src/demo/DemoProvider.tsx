import { useCallback, useMemo, useState, type ReactNode } from "react";

import {
  DemoContext,
  initialRecords,
  profileLabels,
  type DemoProfile,
  type NewDemoAccess,
} from "./DemoContext";

export function DemoProvider({ children }: { children: ReactNode }) {
  const [accountName, setAccountName] = useState("Administrador demonstrativo");
  const [profile, setProfile] = useState<DemoProfile>("administrador");
  const [records, setRecords] = useState(initialRecords);
  const [notice, setNotice] = useState<string | null>(null);

  const setDemoAccount = useCallback(
    (nextProfile: DemoProfile, nextAccountName: string) => {
      setProfile(nextProfile);
      setAccountName(nextAccountName);
    },
    [],
  );

  const registerAccess = useCallback((record: NewDemoAccess) => {
    const entryAt = new Date();
    setRecords((current) => [
      {
        ...record,
        id: Date.now(),
        entryAt: entryAt.toISOString(),
        expectedExitAt: record.expectedDurationMinutes
          ? new Date(
              entryAt.getTime() + record.expectedDurationMinutes * 60_000,
            ).toISOString()
          : undefined,
        plate: record.plate.trim().toUpperCase(),
      },
      ...current,
    ]);
    setNotice("Entrada adicionada ao protótipo. Nenhum dado foi enviado.");
  }, []);

  const closeAccess = useCallback((id: number) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? { ...record, exitAt: new Date().toISOString() }
          : record,
      ),
    );
    setNotice("Saída simulada com sucesso. Nenhum dado foi enviado.");
  }, []);

  const value = useMemo(
    () => ({
      accountName,
      clearNotice: () => setNotice(null),
      closeAccess,
      notice,
      profile,
      profileLabel: profileLabels[profile],
      records,
      registerAccess,
      setDemoAccount,
    }),
    [
      accountName,
      closeAccess,
      notice,
      profile,
      records,
      registerAccess,
      setDemoAccount,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
