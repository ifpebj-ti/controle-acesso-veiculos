import { useCallback, useEffect, useRef, useState } from "react";

import { describeApiError } from "../../../services/api-errors";
import {
  closeAccessRecord,
  listOpenAccessRecords,
} from "../services/accessRecordsService";
import type { AccessRecord } from "../types";

export type OpenAccessRequestStatus = "loading" | "ready" | "error" | "denied";

interface RefreshOptions {
  exitPlate?: string;
  preserveRecords?: boolean;
}

export function useOpenAccessRecords() {
  const [records, setRecords] = useState<AccessRecord[]>([]);
  const [status, setStatus] = useState<OpenAccessRequestStatus>("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<number | null>(null);
  const requestSequence = useRef(0);
  const hasSuccessfulResponse = useRef(false);
  const closingRef = useRef(false);

  const refresh = useCallback(async (options: RefreshOptions = {}) => {
    const preserveRecords =
      options.preserveRecords ?? hasSuccessfulResponse.current;
    const requestId = ++requestSequence.current;

    setQueryError(null);
    if (preserveRecords) {
      setIsRefreshing(true);
    } else {
      setStatus("loading");
      setRecords([]);
    }

    try {
      const response = await listOpenAccessRecords();
      if (requestId !== requestSequence.current) return false;

      setRecords(response);
      setLastUpdatedAt(new Date());
      setStatus("ready");
      hasSuccessfulResponse.current = true;
      return true;
    } catch (error) {
      if (requestId !== requestSequence.current) return false;

      const description = describeApiError(error);
      if (description.kind === "access-denied") {
        setRecords([]);
        setStatus("denied");
        setQueryError(description.message);
        return false;
      }

      if (preserveRecords) {
        const context = options.exitPlate
          ? `A saída de ${options.exitPlate} foi registrada, mas não foi possível atualizar a lista.`
          : "Não foi possível atualizar a lista.";
        setQueryError(
          `${context} Os dados exibidos podem estar desatualizados. Tente novamente sem repetir a saída.`,
        );
        setStatus("ready");
      } else {
        setRecords([]);
        setStatus("error");
        setQueryError(description.message);
      }
      return false;
    } finally {
      if (requestId === requestSequence.current) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void refresh({ preserveRecords: false });
    });
    return () => {
      active = false;
      requestSequence.current += 1;
    };
  }, [refresh]);

  const closeRecord = useCallback(
    async (record: AccessRecord) => {
      if (closingRef.current) return false;

      closingRef.current = true;
      setClosingId(record.id);
      setOperationError(null);
      setNotice(null);

      try {
        const closedRecord = await closeAccessRecord(record.id);
        setRecords((current) =>
          current.filter((item) => item.id !== closedRecord.id),
        );
        setNotice(
          `Saída do veículo ${closedRecord.plate} registrada com sucesso.`,
        );
        void refresh({ exitPlate: closedRecord.plate, preserveRecords: true });
        return true;
      } catch (error) {
        const description = describeApiError(error);
        if (description.kind === "access-denied") {
          setStatus("denied");
        }
        setOperationError(description.message);
        return false;
      } finally {
        closingRef.current = false;
        setClosingId(null);
      }
    },
    [refresh],
  );

  return {
    clearNotice: () => setNotice(null),
    clearOperationError: () => setOperationError(null),
    closeRecord,
    closingId,
    isRefreshing,
    lastUpdatedAt,
    notice,
    operationError,
    queryError,
    records,
    refresh,
    status,
  };
}
