import { useCallback, useMemo, useState, type ReactNode } from "react";

import {
  DemoContext,
  initialAuthorizedPeople,
  initialRecords,
  profileLabels,
  shiftForDate,
  type DemoProfile,
  type NewDemoAuthorizedPerson,
  type NewDemoAccess,
} from "./DemoContext";

export function DemoProvider({ children }: { children: ReactNode }) {
  const [accountName, setAccountName] = useState("Administrador demonstrativo");
  const [profile, setProfile] = useState<DemoProfile>("administrador");
  const [records, setRecords] = useState(initialRecords);
  const [authorizedPeople, setAuthorizedPeople] = useState(
    initialAuthorizedPeople,
  );
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
        shift: shiftForDate(entryAt),
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

  const addAuthorizedPerson = useCallback((person: NewDemoAuthorizedPerson) => {
    setAuthorizedPeople((current) => [
      ...current,
      { ...person, active: true, id: `person-${Date.now()}` },
    ]);
  }, []);

  const toggleAuthorizedPerson = useCallback((id: string) => {
    setAuthorizedPeople((current) =>
      current.map((person) =>
        person.id === id ? { ...person, active: !person.active } : person,
      ),
    );
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
      addAuthorizedPerson,
      authorizedPeople,
      clearNotice: () => setNotice(null),
      closeAccess,
      notice,
      profile,
      profileLabel: profileLabels[profile],
      records,
      registerAccess,
      setDemoAccount,
      toggleAuthorizedPerson,
    }),
    [
      accountName,
      addAuthorizedPerson,
      authorizedPeople,
      closeAccess,
      notice,
      profile,
      records,
      registerAccess,
      setDemoAccount,
      toggleAuthorizedPerson,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
