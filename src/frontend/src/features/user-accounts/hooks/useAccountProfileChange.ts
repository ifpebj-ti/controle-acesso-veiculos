import { useRef, useState } from "react";

import { describeApiError } from "../../../services/api-errors";
import { changeAccountProfileFormSchema } from "../schemas/userAccountSchemas";
import {
  changeAccountProfile,
  UserAccountsContractError,
} from "../services/userAccountsService";
import type {
  ChangeAccountProfileInput,
  ChangedAccountProfile,
  UserAccount,
} from "../types";

interface Options {
  pendingAction: string | null;
  ready: boolean;
  setPendingAction: (action: string | null) => void;
  onSuccess: (
    account: UserAccount,
    result: ChangedAccountProfile,
    trigger: HTMLElement | null,
  ) => Promise<void>;
  onDenied: (message: string) => void;
  onReload: () => void;
}

export function useAccountProfileChange({
  pendingAction,
  ready,
  setPendingAction,
  onSuccess,
  onDenied,
  onReload,
}: Options) {
  const [target, setTarget] = useState<UserAccount | null>(null);
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const [requiresReload, setRequiresReload] = useState(false);

  function open(account: UserAccount, trigger: HTMLElement) {
    if (!ready || pendingAction || inFlight.current || !account.active) return;
    setTarget(account);
    setReturnFocusTo(trigger);
    setError(null);
    setRequiresReload(false);
  }

  function close() {
    if (pendingAction || inFlight.current) return;
    setTarget(null);
    setError(null);
    setReturnFocusTo(null);
    if (requiresReload) onReload();
  }

  async function confirm(input: ChangeAccountProfileInput) {
    if (!target || pendingAction || inFlight.current || requiresReload) return;
    const validated = changeAccountProfileFormSchema.safeParse(input);
    if (!validated.success || input.profileName === target.profileName) return;
    inFlight.current = true;
    setPendingAction(`profile-${target.id}`);
    setError(null);
    try {
      const result = await changeAccountProfile(target.id, validated.data);
      setTarget(null);
      setReturnFocusTo(null);
      await onSuccess(target, result, returnFocusTo);
    } catch (failure) {
      const description = describeApiError(failure);
      if (
        description.kind === "access-denied" ||
        description.kind === "session-expired"
      ) {
        setTarget(null);
        setReturnFocusTo(null);
        onDenied(description.message);
      } else {
        setRequiresReload(
          failure instanceof UserAccountsContractError ||
            description.kind === "network" ||
            description.kind === "unexpected" ||
            description.status === 404,
        );
        setError(
          failure instanceof UserAccountsContractError
            ? "Não foi possível confirmar o resultado. Feche esta janela e atualize a lista antes de tentar outra alteração."
            : description.status === 404
              ? "A conta não foi encontrada. Feche esta janela e atualize a lista."
              : description.kind === "network"
                ? "A conexão foi interrompida. Confira o perfil na lista antes de confirmar novamente; a alteração pode ter sido recebida."
                : description.message,
        );
      }
    } finally {
      inFlight.current = false;
      setPendingAction(null);
    }
  }

  return { target, returnFocusTo, error, requiresReload, open, close, confirm };
}
