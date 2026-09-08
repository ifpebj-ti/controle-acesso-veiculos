import { useCallback, useEffect, useRef, useState } from "react";

import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import { searchAuditTrail } from "../services/auditTrailService";
import type {
  AuditTrailFilterErrors,
  AuditTrailFilters,
  AuditTrailPage,
} from "../types";

const filterErrorKeys = [
  "action",
  "actor",
  "actorUserId",
  "entity",
  "page",
  "pageSize",
  "period",
  "recordId",
] as const;
const maximumPeriod = 90 * 24 * 60 * 60 * 1000;

function toLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function initialFilters(): AuditTrailFilters {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    action: "",
    entity: "",
    fromUtc: toLocalInput(from),
    page: 1,
    pageSize: 25,
    toUtc: toLocalInput(to),
  };
}

function extractFilterErrors(error: unknown): AuditTrailFilterErrors {
  const errors = getApiValidationErrors(error);
  return Object.fromEntries(
    filterErrorKeys.flatMap((key) => (errors[key] ? [[key, errors[key]]] : [])),
  );
}

function validate(filters: AuditTrailFilters): AuditTrailFilterErrors {
  const errors: AuditTrailFilterErrors = {};
  const from = Date.parse(filters.fromUtc);
  const to = Date.parse(filters.toUtc);
  if (
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    from >= to ||
    to - from > maximumPeriod
  ) {
    errors.period =
      "O início deve ser anterior ao fim e o período deve ter no máximo 90 dias.";
  }
  if (filters.entity.trim().length > 100) {
    errors.entity = "A entidade deve possuir até 100 caracteres.";
  }
  if (filters.recordId !== undefined && filters.recordId <= 0) {
    errors.recordId = "O identificador do registro deve ser positivo.";
  }
  if (filters.actorUserId !== undefined && filters.actorUserId <= 0) {
    errors.actorUserId = "O identificador do usuário deve ser positivo.";
  }
  if (filters.systemOnly === true && filters.actorUserId !== undefined) {
    errors.actor =
      "Eventos do sistema não podem ser combinados com um usuário específico.";
  }
  return errors;
}

export function useAuditTrail(enabled: boolean) {
  const [firstFilters] = useState(initialFilters);
  const requestId = useRef(0);
  const [draft, setDraft] = useState(firstFilters);
  const [applied, setApplied] = useState(firstFilters);
  const [page, setPage] = useState<AuditTrailPage | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "error" | "denied"
  >(enabled ? "loading" : "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterErrors, setFilterErrors] = useState<AuditTrailFilterErrors>({});

  const load = useCallback(
    async (filters: AuditTrailFilters) => {
      if (!enabled) return;
      const currentRequest = ++requestId.current;
      setStatus("loading");
      setErrorMessage(null);
      setFilterErrors({});
      try {
        const result = await searchAuditTrail(filters);
        if (requestId.current !== currentRequest) return;
        setPage(result);
        setStatus("ready");
      } catch (error) {
        if (requestId.current !== currentRequest) return;
        const description = describeApiError(error);
        const serverErrors =
          description.kind === "validation" ? extractFilterErrors(error) : {};
        if (Object.keys(serverErrors).length > 0) {
          setFilterErrors(serverErrors);
          setStatus("ready");
          return;
        }
        setPage(null);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(description.message);
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    const currentRequest = ++requestId.current;
    void searchAuditTrail(firstFilters)
      .then((result) => {
        if (requestId.current !== currentRequest) return;
        setPage(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (requestId.current !== currentRequest) return;
        const description = describeApiError(error);
        const serverErrors =
          description.kind === "validation" ? extractFilterErrors(error) : {};
        if (Object.keys(serverErrors).length > 0) {
          setFilterErrors(serverErrors);
          setStatus("ready");
          return;
        }
        setPage(null);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(description.message);
      });
    return () => {
      requestId.current += 1;
    };
  }, [enabled, firstFilters]);

  function updateDraft(next: AuditTrailFilters) {
    setFilterErrors((current) => {
      const remaining = { ...current };
      if (next.action !== draft.action) delete remaining.action;
      if (next.entity !== draft.entity) delete remaining.entity;
      if (next.recordId !== draft.recordId) delete remaining.recordId;
      if (next.actorUserId !== draft.actorUserId) {
        delete remaining.actorUserId;
        delete remaining.actor;
      }
      if (next.systemOnly !== draft.systemOnly) delete remaining.actor;
      if (next.fromUtc !== draft.fromUtc || next.toUtc !== draft.toUtc) {
        delete remaining.period;
      }
      return remaining;
    });
    setDraft(next);
  }

  function applyFilters() {
    const errors = validate(draft);
    if (Object.keys(errors).length > 0) {
      setFilterErrors(errors);
      return;
    }
    const next = { ...draft, page: 1 };
    setDraft(next);
    setApplied(next);
    void load(next);
  }

  function clearFilters() {
    const next = initialFilters();
    setDraft(next);
    setApplied(next);
    setFilterErrors({});
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
    filterErrors,
    goToPage,
    page,
    retry: () => void load(applied),
    setDraft: updateDraft,
    status,
  };
}
