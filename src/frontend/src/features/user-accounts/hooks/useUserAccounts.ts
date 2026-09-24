import { useCallback, useEffect, useRef, useState } from "react";

import { useConfirmation } from "../../../components/ui/confirmationContext";
import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import {
  createUserAccount,
  deactivateUserAccount,
  reactivateUserAccount,
  resetTemporaryCredential,
  searchUserAccounts,
} from "../services/userAccountsService";
import type {
  CredentialResetReason,
  CreateUserAccountInput,
  TemporaryCredential,
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

const createFields = ["email", "name", "profileName"] as const;

interface CredentialDisclosure {
  accountId?: number;
  accountName: string;
  credential: TemporaryCredential;
  returnFocusTo: HTMLElement | null;
}

function createFieldErrors(error: unknown) {
  const errors = getApiValidationErrors(error);
  return Object.fromEntries(
    createFields.flatMap((field) =>
      errors[field] ? [[field, errors[field]]] : [],
    ),
  ) as UserAccountServerErrors;
}

export function useUserAccounts() {
  const confirmAction = useConfirmation();
  const requestId = useRef(0);
  const [draft, setDraft] = useState<UserAccountFilters>(initialFilters);
  const [applied, setApplied] = useState<UserAccountFilters>(initialFilters);
  const [page, setPage] = useState<UserAccountPage | null>(null);
  const [status, setStatus] = useState<AccountStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formReturnFocusTo, setFormReturnFocusTo] =
    useState<HTMLElement | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<UserAccountServerErrors>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [credentialDisclosure, setCredentialDisclosure] =
    useState<CredentialDisclosure | null>(null);
  const [resetTarget, setResetTarget] = useState<UserAccount | null>(null);
  const [resetReturnFocusTo, setResetReturnFocusTo] =
    useState<HTMLElement | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  function clearSensitiveTransientState() {
    setCredentialDisclosure(null);
    setResetTarget(null);
    setResetError(null);
    setResetReturnFocusTo(null);
    setFormOpen(false);
    setFormError(null);
    setServerErrors({});
    setFormReturnFocusTo(null);
  }

  const load = useCallback(
    async (filters: UserAccountFilters, persistedMessage?: string) => {
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
    [],
  );

  useEffect(() => {
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
  }, []);

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

  function openForm(trigger?: HTMLElement | null) {
    if (pendingAction || status !== "ready") return;
    setNotice(null);
    setErrorMessage(null);
    setFormError(null);
    setServerErrors({});
    setFormReturnFocusTo(trigger ?? null);
    setFormOpen(true);
  }

  function closeForm() {
    if (pendingAction) return;
    setFormOpen(false);
    setFormError(null);
    setServerErrors({});
    setFormReturnFocusTo(null);
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
      const created = await createUserAccount(input);
      const credential = {
        temporaryCredential: created.temporaryCredential,
        temporaryCredentialExpiresAtUtc:
          created.temporaryCredentialExpiresAtUtc,
      };
      setCredentialDisclosure({
        accountId: created.id,
        accountName: input.name,
        credential,
        returnFocusTo: formReturnFocusTo,
      });
      setFormReturnFocusTo(null);
      setFormOpen(false);
      await load(applied, "Conta criada com sucesso.");
    } catch (error) {
      const description = describeApiError(error);
      const fieldErrors = createFieldErrors(error);
      if (description.kind === "access-denied") {
        clearSensitiveTransientState();
        setStatus("denied");
        setErrorMessage(description.message);
      } else {
        setServerErrors(fieldErrors);
        setFormError(
          Object.keys(fieldErrors).length > 0
            ? "Revise os campos destacados."
            : description.message,
        );
      }
    } finally {
      setPendingAction(null);
    }
  }

  function closeCredentialDisclosure() {
    setCredentialDisclosure(null);
  }

  function openCredentialReset(
    account: UserAccount,
    trigger?: HTMLElement | null,
  ) {
    if (pendingAction || status !== "ready" || !account.active) return;
    setResetError(null);
    setResetReturnFocusTo(trigger ?? null);
    setResetTarget(account);
  }

  function closeCredentialReset() {
    if (pendingAction) return;
    setResetError(null);
    setResetTarget(null);
    setResetReturnFocusTo(null);
  }

  async function confirmCredentialReset(reason: CredentialResetReason) {
    if (!resetTarget || pendingAction) return;
    const account = resetTarget;
    setPendingAction(`reset-${account.id}`);
    setResetError(null);
    setNotice(null);
    setErrorMessage(null);
    try {
      const credential = await resetTemporaryCredential(account.id, reason);
      setResetTarget(null);
      setCredentialDisclosure({
        accountId: account.id,
        accountName: account.name,
        credential,
        returnFocusTo: resetReturnFocusTo,
      });
      setResetReturnFocusTo(null);
      await load(
        applied,
        `Credencial de ${account.name} redefinida com sucesso.`,
      );
    } catch (error) {
      const description = describeApiError(error);
      if (description.kind === "access-denied") {
        clearSensitiveTransientState();
        setStatus("denied");
        setErrorMessage(description.message);
      } else {
        setResetError(
          description.status === 404
            ? "A conta não foi encontrada. Atualize a lista antes de tentar novamente."
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
    const confirmed = await confirmAction({
      confirmLabel: account.active ? "Desativar conta" : "Reativar conta",
      description: account.active
        ? `A conta de ${account.name} perderá o acesso ao sistema. O histórico e a autoria serão preservados.`
        : `A conta de ${account.name} voltará a acessar o sistema conforme o perfil cadastrado.`,
      eyebrow: "Conta de usuário",
      title: account.active ? "Desativar conta?" : "Reativar conta?",
      tone: account.active ? "danger" : "positive",
    });
    if (!confirmed) return;

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
      if (description.kind === "access-denied") {
        clearSensitiveTransientState();
        setStatus("denied");
      }
      setErrorMessage(description.message);
    } finally {
      setPendingAction(null);
    }
  }

  return {
    applyFilters,
    changeAccountState,
    closeCredentialDisclosure,
    closeCredentialReset,
    clearFilters,
    clearServerError,
    closeForm,
    draft,
    errorMessage,
    filterError,
    formError,
    formOpen,
    credentialDisclosure,
    goToPage,
    notice,
    openCredentialReset,
    openForm,
    page,
    pendingAction,
    retry: () => void load(applied),
    saveAccount,
    confirmCredentialReset,
    resetError,
    resetReturnFocusTo,
    resetTarget,
    serverErrors,
    setDraft: updateDraft,
    setNotice,
    status,
  };
}
