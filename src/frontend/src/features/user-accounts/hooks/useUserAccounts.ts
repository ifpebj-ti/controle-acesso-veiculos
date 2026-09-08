import { useCallback, useEffect, useRef, useState } from "react";

import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import {
  createUserAccount,
  deactivateUserAccount,
  reactivateUserAccount,
  searchUserAccounts,
} from "../services/userAccountsService";
import type {
  CreateUserAccountInput,
  UserAccount,
  UserAccountFilters,
  UserAccountPage,
  UserAccountServerErrors,
} from "../types";

type AccountStatus =
  "idle" | "loading" | "ready" | "error" | "denied" | "filter-error";

const initialFilters: UserAccountFilters = {
  page: 1,
  pageSize: 25,
  search: "",
};

const createFields = ["email", "name", "password", "profileName"] as const;

function createFieldErrors(error: unknown) {
  const errors = getApiValidationErrors(error);
  return Object.fromEntries(
    createFields.flatMap((field) =>
      errors[field] ? [[field, errors[field]]] : [],
    ),
  ) as UserAccountServerErrors;
}

export function useUserAccounts(enabled = true) {
  const requestId = useRef(0);
  const [draft, setDraft] = useState<UserAccountFilters>(initialFilters);
  const [applied, setApplied] = useState<UserAccountFilters>(initialFilters);
  const [page, setPage] = useState<UserAccountPage | null>(null);
  const [status, setStatus] = useState<AccountStatus>(
    enabled ? "loading" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<UserAccountServerErrors>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const load = useCallback(
    async (filters: UserAccountFilters, persistedMessage?: string) => {
      if (!enabled) return;
      const currentRequest = ++requestId.current;
      setStatus("loading");
      setPage(null);
      setErrorMessage(null);
      setFilterError(null);
      if (!persistedMessage) setNotice(null);
      try {
        const result = await searchUserAccounts(filters);
        if (requestId.current !== currentRequest) return;
        setPage(result);
        setStatus("ready");
        if (persistedMessage) setNotice(persistedMessage);
      } catch (error) {
        if (requestId.current !== currentRequest) return;
        const description = describeApiError(error);
        const validationErrors = getApiValidationErrors(error);
        if (description.kind === "validation" && validationErrors.search) {
          setFilterError(validationErrors.search);
          setStatus("filter-error");
          return;
        }
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(
          persistedMessage
            ? `${persistedMessage} Porém, não foi possível atualizar a lista. Tente recarregar sem repetir a operação.`
            : description.message,
        );
        setNotice(null);
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    const currentRequest = ++requestId.current;
    void searchUserAccounts(initialFilters)
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
  }, [enabled]);

  function updateDraft(next: UserAccountFilters) {
    setDraft(next);
    setFilterError(null);
  }

  function applyFilters() {
    if (draft.search.trim().length > 254) {
      setFilterError("A busca deve possuir até 254 caracteres.");
      return;
    }
    const next = { ...draft, page: 1 };
    setApplied(next);
    setDraft(next);
    void load(next);
  }

  function clearFilters() {
    setApplied(initialFilters);
    setDraft(initialFilters);
    setFilterError(null);
    void load(initialFilters);
  }

  function goToPage(nextPage: number) {
    const next = { ...applied, page: nextPage };
    setApplied(next);
    setDraft((current) => ({ ...current, page: nextPage }));
    void load(next);
  }

  function openForm() {
    if (pendingAction || status !== "ready") return;
    setNotice(null);
    setErrorMessage(null);
    setFormError(null);
    setServerErrors({});
    setFormOpen(true);
  }

  function closeForm() {
    if (pendingAction) return;
    setFormOpen(false);
    setFormError(null);
    setServerErrors({});
  }

  function clearServerError(field: keyof UserAccountServerErrors) {
    setServerErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function saveAccount(input: CreateUserAccountInput) {
    if (!formOpen || pendingAction) return;
    setPendingAction("create");
    setNotice(null);
    setErrorMessage(null);
    setFormError(null);
    setServerErrors({});
    try {
      await createUserAccount(input);
      setFormOpen(false);
      await load(applied, "Conta criada com sucesso.");
    } catch (error) {
      const description = describeApiError(error);
      const fieldErrors = createFieldErrors(error);
      if (description.kind === "access-denied") {
        setStatus("denied");
        setErrorMessage(description.message);
      } else {
        setServerErrors(fieldErrors);
        setFormError(
          Object.keys(fieldErrors).length > 0
            ? "Revise os campos destacados e informe novamente a senha temporária."
            : description.message,
        );
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function changeAccountState(account: UserAccount) {
    if (pendingAction) return;
    const action = account.active ? "desativar" : "reativar";
    if (
      !window.confirm(
        `${account.active ? "Desativar" : "Reativar"} a conta de ${account.name}? ${
          account.active
            ? "O histórico e a autoria serão preservados."
            : "O acesso voltará a ser permitido conforme o perfil cadastrado."
        }`,
      )
    )
      return;

    setPendingAction(`${action}-${account.id}`);
    setNotice(null);
    setErrorMessage(null);
    try {
      if (account.active) await deactivateUserAccount(account.id);
      else await reactivateUserAccount(account.id);
      await load(
        applied,
        `Conta de ${account.name} ${account.active ? "desativada" : "reativada"} com sucesso.`,
      );
    } catch (error) {
      const description = describeApiError(error);
      if (description.kind === "access-denied") setStatus("denied");
      setErrorMessage(description.message);
    } finally {
      setPendingAction(null);
    }
  }

  return {
    applyFilters,
    changeAccountState,
    clearFilters,
    clearServerError,
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
    retry: () => void load(applied),
    saveAccount,
    serverErrors,
    setDraft: updateDraft,
    setNotice,
    status,
  };
}
