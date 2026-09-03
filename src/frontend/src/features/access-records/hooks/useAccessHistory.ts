import { useEffect, useState } from "react";

import { describeApiError } from "../../../services/api-errors";
import { searchAccessHistory } from "../services/accessRecordsService";
import type { AccessHistoryFilters, PagedAccessRecords } from "../types";

export type PeriodPreset = "7" | "30" | "90" | "365" | "custom";
export type AccessHistoryRequestStatus =
  "loading" | "ready" | "error" | "denied";

export interface AccessHistoryFilterDraft {
  plate: string;
  driverName: string;
  categoryName: string;
  status: string;
  period: PeriodPreset;
  fromDate: string;
  toDate: string;
}

const pageSize = 25;

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function periodDates(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { fromDate: dateInputValue(from), toDate: dateInputValue(to) };
}

function createInitialDraft(): AccessHistoryFilterDraft {
  return {
    categoryName: "",
    driverName: "",
    plate: "",
    period: "30",
    status: "",
    ...periodDates(30),
  };
}

function toApiFilters(
  draft: AccessHistoryFilterDraft,
  page: number,
): AccessHistoryFilters {
  return {
    categoryName: draft.categoryName || undefined,
    driverName: draft.driverName.trim() || undefined,
    from: new Date(`${draft.fromDate}T00:00:00`).toISOString(),
    page,
    pageSize,
    plate: draft.plate.trim() || undefined,
    status: (draft.status || undefined) as AccessHistoryFilters["status"],
    to: new Date(`${draft.toDate}T23:59:59.999`).toISOString(),
  };
}

export function useAccessHistory() {
  const [draft, setDraft] = useState(createInitialDraft);
  const [filters, setFilters] = useState(() => toApiFilters(draft, 1));
  const [result, setResult] = useState<PagedAccessRecords | null>(null);
  const [requestStatus, setRequestStatus] =
    useState<AccessHistoryRequestStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void searchAccessHistory(filters)
      .then((response) => {
        if (!active) return;
        setResult(response);
        setRequestStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        const description = describeApiError(error);
        setResult(null);
        setErrorMessage(description.message);
        setRequestStatus(
          description.kind === "access-denied" ? "denied" : "error",
        );
      });

    return () => {
      active = false;
    };
  }, [filters]);

  function startRequest(nextFilters: AccessHistoryFilters) {
    setRequestStatus("loading");
    setResult(null);
    setErrorMessage(null);
    setFilters(nextFilters);
  }

  function selectPeriod(period: PeriodPreset) {
    if (period === "custom") {
      setDraft((current) => ({ ...current, period }));
      return;
    }

    setDraft((current) => ({
      ...current,
      period,
      ...periodDates(Number(period)),
    }));
  }

  function applyFilters() {
    startRequest(toApiFilters(draft, 1));
  }

  function clearFilters() {
    const next = createInitialDraft();
    setDraft(next);
    startRequest(toApiFilters(next, 1));
  }

  function goToPage(page: number) {
    startRequest({ ...filters, page });
  }

  function retry() {
    startRequest({ ...filters });
  }

  return {
    applyFilters,
    clearFilters,
    draft,
    errorMessage,
    goToPage,
    requestStatus,
    result,
    retry,
    selectPeriod,
    setDraft,
  };
}
