import { useCallback, useEffect, useRef, useState } from "react";
import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import type {
  AddCampusVehicleInput,
  CampusDriverPage,
  CampusDriverSearch,
  RegisterCampusDriverInput,
} from "../schemas/campusDriverSchemas";
import {
  addCampusDriverVehicle,
  CampusDriversContractError,
  deactivateCampusDriver,
  registerCampusDriver,
  searchCampusDrivers,
} from "../services/campusDriversService";

const initialFilters: CampusDriverSearch = {
  query: "",
  page: 1,
  pageSize: 25,
  includeInactive: false,
};
type Status = "loading" | "ready" | "error" | "denied";
const formFields = [
  "name",
  "affiliation",
  "birthDate",
  "birthDateConfirmed",
  "plate",
  "vehicleType",
];

export function useCampusDriverRegistry(scope: string) {
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState<CampusDriverPage | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [readError, setReadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [possibleDuplicate, setPossibleDuplicate] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const readSequence = useRef(0),
    mutationSequence = useRef(0),
    sending = useRef(false);

  const [activeScope, setActiveScope] = useState(scope);
  const lifetime = useRef<() => boolean>(() => true);
  if (activeScope !== scope) {
    setActiveScope(scope);
    setFilters(initialFilters);
    setResult(null);
    setStatus("loading");
    setReadError(null);
    setNotice(null);
    setMutationError(null);
    setFieldErrors({});
    setPossibleDuplicate(false);
    setUncertain(false);
    setPending(false);
  }
  useEffect(() => {
    let active = true;
    lifetime.current = () => active;
    sending.current = false;
    mutationSequence.current++;
    return () => {
      active = false;
    };
  }, [scope]);

  useEffect(() => {
    const sequence = ++readSequence.current,
      controller = new AbortController();
    void searchCampusDrivers(filters, controller.signal)
      .then((page) => {
        if (controller.signal.aborted || sequence !== readSequence.current)
          return;
        const lastPage = Math.max(
          1,
          Math.ceil(page.totalCount / page.pageSize),
        );
        if (filters.page > lastPage) {
          setFilters((current) => ({ ...current, page: lastPage }));
          return;
        }
        setResult(page);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || sequence !== readSequence.current)
          return;
        const description = describeApiError(error);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setReadError(
          error instanceof CampusDriversContractError
            ? "A resposta do cadastro é incompatível. Tente consultar novamente."
            : description.message,
        );
      });
    return () => controller.abort();
  }, [filters, revision, scope]);

  const refresh = useCallback(() => {
    setStatus("loading");
    setReadError(null);
    setResult(null);
    setRevision((value) => value + 1);
  }, []);
  function clearFormErrors() {
    setFieldErrors({});
    setPossibleDuplicate(false);
    setMutationError(null);
  }
  async function execute(operation: () => Promise<unknown>, success: string) {
    if (sending.current || uncertain) return false;
    sending.current = true;
    setPending(true);
    setMutationError(null);
    setNotice(null);
    setFieldErrors({});
    setPossibleDuplicate(false);
    const sequence = ++mutationSequence.current;
    const isActive = lifetime.current;
    try {
      await operation();
      if (!isActive() || sequence !== mutationSequence.current) return false;
      setNotice(success);
      refresh();
      return true;
    } catch (error) {
      if (!isActive() || sequence !== mutationSequence.current) return false;
      const description = describeApiError(error),
        errors = getApiValidationErrors(error);
      const duplicate =
        description.status === 409 &&
        typeof errors.possibleDuplicate === "string";
      setPossibleDuplicate(duplicate);
      setFieldErrors(
        Object.fromEntries(
          Object.entries(errors).filter(([field]) =>
            formFields.includes(field),
          ),
        ),
      );
      const certainRejection =
        [400, 401, 403, 404, 422, 429].includes(description.status ?? 0) ||
        duplicate ||
        (description.status === 409 && Boolean(errors.vehicle));
      if (!certainRejection) {
        setUncertain(true);
        setMutationError(
          error instanceof CampusDriversContractError
            ? "A resposta do envio é incompatível; o resultado não foi confirmado. Não envie novamente. Consulte os cadastros para conferir."
            : "Não foi possível confirmar o resultado do envio. Cancelamento ou perda de resposta não significam que ele foi desfeito. Não repita; consulte os cadastros para conferir.",
        );
      } else if (duplicate) {
        setMutationError(
          "Há um possível homônimo. Confira o cadastro existente antes de confirmar que esta é outra pessoa.",
        );
      } else {
        setMutationError(description.message);
        if (description.kind === "access-denied") setStatus("denied");
      }
      return false;
    } finally {
      if (isActive() && sequence === mutationSequence.current) {
        sending.current = false;
        setPending(false);
      }
    }
  }
  return {
    filters,
    result,
    status,
    readError,
    notice,
    mutationError,
    fieldErrors,
    possibleDuplicate,
    uncertain,
    pending,
    refresh,
    clearFormErrors,
    search: (query: string, includeInactive: boolean) => {
      setStatus("loading");
      setReadError(null);
      setResult(null);
      setFilters({ ...initialFilters, query: query.trim(), includeInactive });
    },
    goToPage: (page: number) => {
      setStatus("loading");
      setReadError(null);
      setResult(null);
      setFilters((current) => ({ ...current, page }));
    },
    register: (input: RegisterCampusDriverInput) =>
      execute(
        () => registerCampusDriver(input),
        "Condutor pré-cadastrado. A entrada ainda precisa ser registrada pela portaria.",
      ),
    addVehicle: (personId: number, input: AddCampusVehicleInput) =>
      execute(
        () => addCampusDriverVehicle(personId, input),
        "Veículo vinculado à pessoa existente.",
      ),
    deactivate: (personId: number) =>
      execute(
        () => deactivateCampusDriver(personId),
        "Pré-cadastro desativado. Os registros históricos foram preservados.",
      ),
  };
}
