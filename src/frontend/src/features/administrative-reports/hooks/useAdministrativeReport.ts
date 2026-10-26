import { useEffect, useState } from "react";

import { describeApiError } from "../../../services/api-errors";
import {
  createInitialReportFilters,
  validateReportPeriod,
} from "../model/reportPresentation";
import {
  searchInstitutionalFleetReport,
  searchVehicleMovementReport,
} from "../services/administrativeReportsService";
import type {
  AdministrativeReportFilters,
  AdministrativeReportKind,
  AdministrativeReportResultPage,
} from "../types";

export type AdministrativeReportLoadStatus =
  "loading" | "ready" | "error" | "denied";

export function useAdministrativeReport() {
  const [kind, setKind] = useState<AdministrativeReportKind>("movements");
  const [draft, setDraft] = useState(createInitialReportFilters);
  const [applied, setApplied] = useState(createInitialReportFilters);
  const [page, setPage] = useState<AdministrativeReportResultPage | null>(null);
  const [status, setStatus] =
    useState<AdministrativeReportLoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    const request =
      kind === "movements"
        ? searchVehicleMovementReport(applied)
        : searchInstitutionalFleetReport(applied);

    void request
      .then((result) => {
        if (!active) return;
        setPage(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        const described = describeApiError(error);
        setPage(null);
        setErrorMessage(described.message);
        setStatus(described.kind === "access-denied" ? "denied" : "error");
      });

    return () => {
      active = false;
    };
  }, [applied, kind]);

  function prepareRequest() {
    setStatus("loading");
    setErrorMessage(null);
  }

  function changeKind(nextKind: AdministrativeReportKind) {
    if (nextKind === kind) return;
    prepareRequest();
    setKind(nextKind);
    setDraft((current) => ({ ...current, page: 1, status: "" }));
    setApplied((current) => ({ ...current, page: 1, status: "" }));
    setValidationMessage(null);
  }

  function applyFilters() {
    const error = validateReportPeriod(draft);
    setValidationMessage(error);
    if (error) return false;
    prepareRequest();
    setApplied({ ...draft, page: 1 });
    return true;
  }

  function clearFilters() {
    const initial = createInitialReportFilters();
    prepareRequest();
    setDraft(initial);
    setApplied(initial);
    setValidationMessage(null);
  }

  function goToPage(nextPage: number) {
    prepareRequest();
    setApplied((current) => ({ ...current, page: nextPage }));
  }

  function retry() {
    prepareRequest();
    setApplied((current) => ({ ...current }));
  }

  return {
    applied,
    applyFilters,
    clearFilters,
    changeKind,
    draft,
    errorMessage,
    goToPage,
    kind,
    page,
    retry,
    setDraft: (filters: AdministrativeReportFilters) => setDraft(filters),
    status,
    validationMessage,
  };
}
