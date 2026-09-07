import { useCallback, useEffect, useRef, useState } from "react";

import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import {
  listOpenInstitutionalUsages,
  registerInstitutionalDeparture,
  registerInstitutionalReturn,
} from "../services/institutionalUsagesService";
import type {
  InstitutionalDepartureInput,
  InstitutionalReturnInput,
  InstitutionalUsageServerErrors,
  InstitutionalVehicleUsage,
} from "../types";

export function useInstitutionalUsageOperations(enabled: boolean) {
  const requestId = useRef(0);
  const [usages, setUsages] = useState<InstitutionalVehicleUsage[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "error" | "denied"
  >(enabled ? "loading" : "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [departureOpen, setDepartureOpen] = useState(false);
  const [returningUsage, setReturningUsage] =
    useState<InstitutionalVehicleUsage | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] =
    useState<InstitutionalUsageServerErrors>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const load = useCallback(
    async (clearNotice = true, refreshFailureMessage?: string) => {
      if (!enabled) return false;
      const currentRequest = ++requestId.current;
      setStatus("loading");
      setUsages([]);
      setErrorMessage(null);
      if (clearNotice) setNotice(null);
      try {
        const result = await listOpenInstitutionalUsages();
        if (requestId.current !== currentRequest) return false;
        setUsages(result);
        setStatus("ready");
        return true;
      } catch (error) {
        if (requestId.current !== currentRequest) return false;
        const description = describeApiError(error);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(
          description.kind === "access-denied"
            ? description.message
            : (refreshFailureMessage ?? description.message),
        );
        return false;
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    const currentRequest = ++requestId.current;
    void listOpenInstitutionalUsages()
      .then((result) => {
        if (requestId.current !== currentRequest) return;
        setUsages(result);
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
  }, [enabled]);

  function resetFormMessages() {
    setFormError(null);
    setServerErrors({});
  }

  function openDeparture() {
    if (pendingAction) return;
    setNotice(null);
    setErrorMessage(null);
    setReturningUsage(null);
    resetFormMessages();
    setDepartureOpen(true);
  }

  function closeDeparture() {
    if (pendingAction) return;
    setDepartureOpen(false);
  }

  function openReturn(usage: InstitutionalVehicleUsage) {
    if (pendingAction) return;
    setNotice(null);
    setErrorMessage(null);
    setDepartureOpen(false);
    resetFormMessages();
    setReturningUsage(usage);
  }

  function closeReturn() {
    if (pendingAction) return;
    setReturningUsage(null);
  }

  async function saveDeparture(input: InstitutionalDepartureInput) {
    if (!departureOpen || pendingAction) return;
    setPendingAction("departure");
    setNotice(null);
    setErrorMessage(null);
    resetFormMessages();
    try {
      await registerInstitutionalDeparture(input);
      setDepartureOpen(false);
      const refreshed = await load(
        false,
        "A saída foi registrada, mas não foi possível recarregar os veículos em uso. Tente novamente para atualizar a lista; não repita a saída.",
      );
      if (refreshed) setNotice("Saída institucional registrada com sucesso.");
    } catch (error) {
      const description = describeApiError(error);
      if (description.kind === "access-denied") {
        setStatus("denied");
        setErrorMessage(description.message);
      } else {
        const validationErrors = getApiValidationErrors(error);
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

  async function saveReturn(input: InstitutionalReturnInput) {
    if (!returningUsage || pendingAction) return;
    const usage = returningUsage;
    const vehicleLabel =
      usage.plate ?? usage.vehicleIdentification ?? "veículo";
    if (
      !window.confirm(
        `Confirmar o retorno do ${vehicleLabel} com ${input.returnMileage} km?`,
      )
    )
      return;

    setPendingAction(`return-${usage.id}`);
    setNotice(null);
    setErrorMessage(null);
    resetFormMessages();
    try {
      await registerInstitutionalReturn(usage.id, input);
      setReturningUsage(null);
      const refreshed = await load(
        false,
        "O retorno foi registrado, mas não foi possível recarregar os veículos em uso. Tente novamente para atualizar a lista; não repita o retorno.",
      );
      if (refreshed) setNotice("Retorno institucional registrado com sucesso.");
    } catch (error) {
      const description = describeApiError(error);
      if (description.kind === "access-denied") {
        setStatus("denied");
        setErrorMessage(description.message);
      } else {
        const validationErrors = getApiValidationErrors(error);
        setServerErrors(validationErrors);
        setFormError(
          Object.keys(validationErrors).length > 0
            ? "Revise a quilometragem destacada e tente novamente."
            : description.message,
        );
      }
    } finally {
      setPendingAction(null);
    }
  }

  return {
    closeDeparture,
    closeReturn,
    departureOpen,
    errorMessage,
    formError,
    load,
    notice,
    openDeparture,
    openReturn,
    pendingAction,
    returningUsage,
    saveDeparture,
    saveReturn,
    serverErrors,
    setNotice,
    status,
    usages,
  };
}
