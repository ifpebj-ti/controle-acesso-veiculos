import { useCallback, useEffect, useRef, useState } from "react";

import {
  listInstitutionalDrivers,
  type InstitutionalDriver,
} from "../../institutional-drivers";
import {
  listInstitutionalVehicles,
  type InstitutionalVehicle,
} from "../../institutional-vehicles";
import { describeApiError } from "../../../services/api-errors";

export function useInstitutionalUsageCatalogs() {
  const requestId = useRef(0);
  const [vehicles, setVehicles] = useState<InstitutionalVehicle[]>([]);
  const [drivers, setDrivers] = useState<InstitutionalDriver[]>([]);
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "denied"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setStatus("loading");
    setVehicles([]);
    setDrivers([]);
    setErrorMessage(null);
    try {
      const [nextVehicles, nextDrivers] = await Promise.all([
        listInstitutionalVehicles(),
        listInstitutionalDrivers(),
      ]);
      if (requestId.current !== currentRequest) return;
      setVehicles(nextVehicles);
      setDrivers(nextDrivers);
      setStatus("ready");
    } catch (error) {
      if (requestId.current !== currentRequest) return;
      const description = describeApiError(error);
      setStatus(description.kind === "access-denied" ? "denied" : "error");
      setErrorMessage(description.message);
    }
  }, []);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    void Promise.all([listInstitutionalVehicles(), listInstitutionalDrivers()])
      .then(([nextVehicles, nextDrivers]) => {
        if (requestId.current !== currentRequest) return;
        setVehicles(nextVehicles);
        setDrivers(nextDrivers);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (requestId.current !== currentRequest) return;
        const description = describeApiError(error);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(description.message);
      });
    return () => {
      requestId.current += 1;
    };
  }, []);

  return { drivers, errorMessage, load, status, vehicles };
}
