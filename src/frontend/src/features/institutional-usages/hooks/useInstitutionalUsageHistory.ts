import { useCallback, useEffect, useRef, useState } from "react";

import { describeApiError } from "../../../services/api-errors";
import { searchInstitutionalUsageHistory } from "../services/institutionalUsagesService";
import type {
  InstitutionalUsageHistoryFilters,
  InstitutionalVehicleUsagePage,
} from "../types";

function toLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function initialFilters(): InstitutionalUsageHistoryFilters {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return {
    fromUtc: toLocalInput(from),
    page: 1,
    pageSize: 25,
    plate: "",
    toUtc: toLocalInput(to),
    vehicleIdentification: "",
  };
}

function asRequestFilters(
  filters: InstitutionalUsageHistoryFilters,
): InstitutionalUsageHistoryFilters {
  return {
    ...filters,
    fromUtc: new Date(filters.fromUtc).toISOString(),
    toUtc: new Date(filters.toUtc).toISOString(),
  };
}

function hasValidPeriod(filters: InstitutionalUsageHistoryFilters) {
  const from = Date.parse(filters.fromUtc);
  const to = Date.parse(filters.toUtc);
  return (
    Number.isFinite(from) &&
    Number.isFinite(to) &&
    from <= to &&
    to - from <= 366 * 24 * 60 * 60 * 1000
  );
}

export function useInstitutionalUsageHistory(enabled: boolean) {
  const [firstFilters] = useState(initialFilters);
  const requestId = useRef(0);
  const [draft, setDraft] =
    useState<InstitutionalUsageHistoryFilters>(firstFilters);
  const [applied, setApplied] =
    useState<InstitutionalUsageHistoryFilters>(firstFilters);
  const [page, setPage] = useState<InstitutionalVehicleUsagePage | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "error" | "denied"
  >(enabled ? "loading" : "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);

  const load = useCallback(
    async (filters: InstitutionalUsageHistoryFilters) => {
      if (!enabled) return;
      const currentRequest = ++requestId.current;
      setStatus("loading");
      setPage(null);
      setErrorMessage(null);
      try {
        const result = await searchInstitutionalUsageHistory(
          asRequestFilters(filters),
        );
        if (requestId.current !== currentRequest) return;
        setPage(result);
        setStatus("ready");
      } catch (error) {
        if (requestId.current !== currentRequest) return;
        const description = describeApiError(error);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(description.message);
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    const currentRequest = ++requestId.current;
    void searchInstitutionalUsageHistory(asRequestFilters(firstFilters))
      .then((result) => {
        if (requestId.current !== currentRequest) return;
        setPage(result);
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
  }, [enabled, firstFilters]);

  function updateDraft(next: InstitutionalUsageHistoryFilters) {
    setFilterError(null);
    setDraft(next);
  }

  function applyFilters() {
    if (!hasValidPeriod(draft)) {
      setFilterError(
        "O período deve estar em ordem cronológica e possuir no máximo 366 dias.",
      );
      return;
    }
    const next = { ...draft, page: 1 };
    setFilterError(null);
    setDraft(next);
    setApplied(next);
    void load(next);
  }

  function clearFilters() {
    const next = initialFilters();
    setFilterError(null);
    setDraft(next);
    setApplied(next);
    void load(next);
  }

  function goToPage(nextPage: number) {
    const next = { ...applied, page: nextPage };
    setApplied(next);
    setDraft((current) => ({ ...current, page: nextPage }));
    void load(next);
  }

  return {
    applyFilters,
    clearFilters,
    draft,
    errorMessage,
    filterError,
    goToPage,
    page,
    retry: () => void load(applied),
    setDraft: updateDraft,
    status,
  };
}
