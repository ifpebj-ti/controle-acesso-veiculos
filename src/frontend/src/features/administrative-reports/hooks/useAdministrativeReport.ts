import { useEffect, useMemo, useState } from "react";

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

type ReportPeriod = Pick<AdministrativeReportFilters, "from" | "to">;
type ReportSpecificFilters = Omit<AdministrativeReportFilters, "from" | "to">;
type ReportFilterPair = {
  draft: ReportSpecificFilters;
  applied: ReportSpecificFilters;
};
type ReportFilterState = {
  draftPeriod: ReportPeriod;
  appliedPeriod: ReportPeriod;
  reports: Record<AdministrativeReportKind, ReportFilterPair>;
};

function createFilterState(): ReportFilterState {
  const { from, to, ...specific } = createInitialReportFilters();
  return {
    draftPeriod: { from, to },
    appliedPeriod: { from, to },
    reports: {
      movements: { draft: { ...specific }, applied: { ...specific } },
      fleet: { draft: { ...specific }, applied: { ...specific } },
    },
  };
}

function resetPagination(filters: ReportFilterPair): ReportFilterPair {
  return {
    draft: { ...filters.draft, page: 1 },
    applied: { ...filters.applied, page: 1 },
  };
}

export function useAdministrativeReport() {
  const [kind, setKind] = useState<AdministrativeReportKind>("movements");
  const [filters, setFilters] = useState(createFilterState);
  const specific = filters.reports[kind];
  const draft = { ...specific.draft, ...filters.draftPeriod };
  const applied = useMemo(
    () => ({ ...specific.applied, ...filters.appliedPeriod }),
    [specific.applied, filters.appliedPeriod],
  );
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
    setFilters((current) => ({
      ...current,
      reports: {
        ...current.reports,
        [nextKind]: resetPagination(current.reports[nextKind]),
      },
    }));
    setValidationMessage(null);
  }

  function applyFilters() {
    const error = validateReportPeriod(draft);
    setValidationMessage(error);
    if (error) return false;
    prepareRequest();
    setFilters((current) => {
      const reports = {
        movements: resetPagination(current.reports.movements),
        fleet: resetPagination(current.reports.fleet),
      };
      reports[kind].applied = { ...reports[kind].draft };
      return {
        ...current,
        appliedPeriod: { ...current.draftPeriod },
        reports,
      };
    });
    return true;
  }

  function clearFilters() {
    const initial = createFilterState();
    prepareRequest();
    setFilters((current) => {
      const reports = {
        movements: resetPagination(current.reports.movements),
        fleet: resetPagination(current.reports.fleet),
      };
      reports[kind] = initial.reports[kind];
      return { ...initial, reports };
    });
    setValidationMessage(null);
  }

  function goToPage(nextPage: number) {
    prepareRequest();
    updateApplied({ ...specific.applied, page: nextPage });
  }

  function retry() {
    prepareRequest();
    updateApplied({ ...specific.applied });
  }

  function updateApplied(next: ReportSpecificFilters) {
    setFilters((current) => ({
      ...current,
      reports: {
        ...current.reports,
        [kind]: { ...current.reports[kind], applied: next },
      },
    }));
  }

  function setDraft({ from, to, ...next }: AdministrativeReportFilters) {
    setFilters((current) => ({
      ...current,
      draftPeriod: { from, to },
      reports: {
        ...current.reports,
        [kind]: { ...current.reports[kind], draft: next },
      },
    }));
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
    setDraft,
    status,
    validationMessage,
  };
}
