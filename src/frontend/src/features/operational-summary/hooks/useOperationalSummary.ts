import { useCallback, useEffect, useRef, useState } from "react";

import { describeApiError } from "../../../services/api-errors";
import { getDailyOperationalSummary } from "../services/operationalSummaryService";
import type { DailyOperationalSummary } from "../types";

type SummaryStatus = "loading" | "ready" | "error" | "denied";

function isValidLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function useOperationalSummary() {
  const requestId = useRef(0);
  const [summary, setSummary] = useState<DailyOperationalSummary | null>(null);
  const [draftDate, setDraftDate] = useState("");
  const [appliedDate, setAppliedDate] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<SummaryStatus>("loading");

  const load = useCallback(async (date?: string) => {
    const currentRequest = ++requestId.current;
    setStatus("loading");
    setErrorMessage(null);
    setSummary(null);
    try {
      const result = await getDailyOperationalSummary(date);
      if (requestId.current !== currentRequest) return;
      setSummary(result);
      setDraftDate(result.localDate);
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
    void getDailyOperationalSummary()
      .then((result) => {
        if (requestId.current !== currentRequest) return;
        setSummary(result);
        setDraftDate(result.localDate);
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

  function updateDraftDate(value: string) {
    setDraftDate(value);
    setDateError(null);
  }

  function applyDate() {
    if (draftDate && !isValidLocalDate(draftDate)) {
      setDateError("Informe uma data válida.");
      return;
    }
    const nextDate = draftDate || undefined;
    setDateError(null);
    setAppliedDate(nextDate);
    void load(nextDate);
  }

  return {
    applyDate,
    dateError,
    draftDate,
    errorMessage,
    retry: () => void load(appliedDate),
    setDraftDate: updateDraftDate,
    status,
    summary,
  };
}
