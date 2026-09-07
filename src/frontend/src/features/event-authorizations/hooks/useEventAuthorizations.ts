import { useCallback, useEffect, useRef, useState } from "react";

import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import {
  cancelEventAuthorization,
  createEventAuthorization,
  searchEventAuthorizations,
  updateEventAuthorization,
} from "../services/eventAuthorizationsService";
import type {
  EventAuthorization,
  EventAuthorizationFilters,
  EventAuthorizationInput,
  EventAuthorizationPage,
  EventAuthorizationServerErrors,
} from "../types";

export type EventAuthorizationRequestStatus =
  "loading" | "ready" | "error" | "denied";

function toLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function initialFilters(): EventAuthorizationFilters {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 30);
  to.setHours(23, 59, 0, 0);
  return {
    active: "true",
    fromUtc: toLocalInput(from),
    name: "",
    page: 1,
    pageSize: 10,
    toUtc: toLocalInput(to),
  };
}

function asRequestFilters(
  filters: EventAuthorizationFilters,
): EventAuthorizationFilters {
  return {
    ...filters,
    fromUtc: filters.fromUtc ? new Date(filters.fromUtc).toISOString() : "",
    toUtc: filters.toUtc ? new Date(filters.toUtc).toISOString() : "",
  };
}

function hasValidPeriod(filters: EventAuthorizationFilters) {
  const from = Date.parse(filters.fromUtc);
  const to = Date.parse(filters.toUtc);
  return (
    Number.isFinite(from) &&
    Number.isFinite(to) &&
    from < to &&
    to - from <= 366 * 24 * 60 * 60 * 1000
  );
}

export function useEventAuthorizations() {
  const [firstFilters] = useState(initialFilters);
  const requestId = useRef(0);
  const [draft, setDraft] = useState<EventAuthorizationFilters>(firstFilters);
  const [applied, setApplied] =
    useState<EventAuthorizationFilters>(firstFilters);
  const [page, setPage] = useState<EventAuthorizationPage | null>(null);
  const [status, setStatus] =
    useState<EventAuthorizationRequestStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventAuthorization | null>(
    null,
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] =
    useState<EventAuthorizationServerErrors>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadEvents = useCallback(
    async (
      filters: EventAuthorizationFilters,
      clearNotice = true,
      refreshFailureMessage?: string,
    ) => {
      const currentRequest = ++requestId.current;
      setStatus("loading");
      setPage(null);
      setErrorMessage(null);
      if (clearNotice) setNotice(null);
      try {
        const result = await searchEventAuthorizations(
          asRequestFilters(filters),
        );
        if (requestId.current !== currentRequest) return false;
        setPage(result);
        setStatus("ready");
        return true;
      } catch (error) {
        if (requestId.current !== currentRequest) return false;
        const description = describeApiError(error);
        setPage(null);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(
          description.kind === "access-denied"
            ? description.message
            : (refreshFailureMessage ?? description.message),
        );
        return false;
      }
    },
    [],
  );

  useEffect(() => {
    const currentRequest = ++requestId.current;
    void searchEventAuthorizations(asRequestFilters(firstFilters))
      .then((result) => {
        if (requestId.current !== currentRequest) return;
        setPage(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (requestId.current !== currentRequest) return;
        const description = describeApiError(error);
        setPage(null);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(description.message);
      });
    return () => {
      requestId.current += 1;
    };
  }, [firstFilters]);

  function applyFilters() {
    if (!hasValidPeriod(draft)) {
      setFilterError(
        "O período deve ter início anterior ao fim e possuir no máximo 366 dias.",
      );
      return;
    }
    const next = { ...draft, page: 1 };
    setFilterError(null);
    setDraft(next);
    setApplied(next);
    void loadEvents(next);
  }

  function clearFilters() {
    const next = initialFilters();
    setFilterError(null);
    setDraft(next);
    setApplied(next);
    void loadEvents(next);
  }

  function openForm(event: EventAuthorization | null = null) {
    if (pendingAction) return;
    setNotice(null);
    setErrorMessage(null);
    setFormError(null);
    setServerErrors({});
    setSelectedEvent(event);
    setFormOpen(true);
  }

  function closeForm() {
    if (pendingAction) return;
    setFormOpen(false);
    setSelectedEvent(null);
  }

  async function saveEvent(input: EventAuthorizationInput) {
    if (!formOpen || pendingAction) return;
    const eventBeingEdited = selectedEvent;
    setPendingAction(
      eventBeingEdited ? `update-${eventBeingEdited.id}` : "create",
    );
    setNotice(null);
    setErrorMessage(null);
    setFormError(null);
    setServerErrors({});
    try {
      if (eventBeingEdited)
        await updateEventAuthorization(eventBeingEdited.id, input);
      else await createEventAuthorization(input);
      setFormOpen(false);
      setSelectedEvent(null);
      const successMessage = eventBeingEdited
        ? "Autorização atualizada com sucesso."
        : "Autorização criada com sucesso.";
      const refreshFailureMessage = eventBeingEdited
        ? "A autorização foi atualizada, mas não foi possível recarregar a lista. Tente novamente para atualizar a consulta; não repita a alteração."
        : "A autorização foi criada, mas não foi possível recarregar a lista. Tente novamente para atualizar a consulta; não repita o cadastro.";
      const refreshed = await loadEvents(applied, false, refreshFailureMessage);
      if (refreshed) setNotice(successMessage);
    } catch (error) {
      const description = describeApiError(error);
      const validationErrors = getApiValidationErrors(error);
      if (description.kind === "access-denied") {
        setStatus("denied");
        setErrorMessage(description.message);
      } else {
        setServerErrors(validationErrors);
        setFormError(
          Object.keys(validationErrors).length > 0
            ? "Revise os campos destacados e tente novamente."
            : description.message,
        );
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function cancelAuthorization(event: EventAuthorization) {
    if (pendingAction) return;
    if (
      !window.confirm(
        `Cancelar a autorização “${event.name}”? O histórico será preservado e a autorização deixará de aceitar novas entradas.`,
      )
    )
      return;
    setPendingAction(`cancel-${event.id}`);
    setNotice(null);
    setErrorMessage(null);
    try {
      await cancelEventAuthorization(event.id);
      const refreshed = await loadEvents(
        applied,
        false,
        `A autorização “${event.name}” foi cancelada, mas não foi possível recarregar a lista. Tente novamente para atualizar a consulta; não repita o cancelamento.`,
      );
      if (refreshed)
        setNotice(`Autorização “${event.name}” cancelada com sucesso.`);
    } catch (error) {
      const description = describeApiError(error);
      if (description.kind === "access-denied") setStatus("denied");
      setErrorMessage(description.message);
    } finally {
      setPendingAction(null);
    }
  }

  function goToPage(nextPage: number) {
    const next = { ...applied, page: nextPage };
    setApplied(next);
    setDraft((current) => ({ ...current, page: nextPage }));
    void loadEvents(next);
  }

  function retry() {
    void loadEvents(applied);
  }

  function updateDraft(next: EventAuthorizationFilters) {
    setFilterError(null);
    setDraft(next);
  }

  return {
    applyFilters,
    cancelAuthorization,
    clearFilters,
    closeForm,
    draft,
    errorMessage,
    filterError,
    formError,
    formOpen,
    goToPage,
    notice,
    openForm,
    page,
    pendingAction,
    retry,
    saveEvent,
    selectedEvent,
    serverErrors,
    setDraft: updateDraft,
    setNotice,
    status,
  };
}
