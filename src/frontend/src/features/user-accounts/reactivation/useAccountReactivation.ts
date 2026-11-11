import { useEffect, useRef, useState } from "react";
import {
  credentialResetReasons,
  type CredentialResetReason,
  type TemporaryCredential,
} from "../types";
import {
  LocalReactivationResetRequiredError,
  reactivateGoogleAccount,
  reactivateLocalAccount,
  reactivationFailure,
} from "./accountReactivationService";
import type { ReactivationAccount, ReadReactivationAccount } from "./types";

type Phase =
  | "editing"
  | "submitting"
  | "credential"
  | "completed"
  | "reconcile"
  | "reading"
  | "blocked"
  | "closed";

export function useAccountReactivation(
  initialAccount: ReactivationAccount,
  readAccount: ReadReactivationAccount,
) {
  const [account, setAccount] = useState(initialAccount);
  const [reason, setReason] = useState<CredentialResetReason | "">("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [credential, setCredential] = useState<TemporaryCredential | null>(
    null,
  );
  const [phase, setPhase] = useState<Phase>("editing");
  const alive = useRef(true);
  const closed = useRef(false);
  const locked = useRef(false);
  const busy = useRef(false);
  const epoch = useRef(0);
  const legacyRefusal = useRef(false);
  const current = useRef(account);
  const currentReason = useRef(reason);

  useEffect(() => {
    const mountedEpoch = epoch.current;
    alive.current = true;
    closed.current = false;
    return () => {
      alive.current = false;
      closed.current = true;
      epoch.current = mountedEpoch + 1;
    };
  }, []);

  function changeReason(value: string) {
    const next = credentialResetReasons.find((item) => item === value) ?? "";
    currentReason.current = next;
    setReason(next);
    setReasonError(null);
  }

  async function confirm() {
    if (!alive.current || closed.current || busy.current || locked.current)
      return;
    const target = current.current;
    if (
      target.active ||
      (target.authenticationMethod !== "Local" &&
        target.authenticationMethod !== "Google")
    ) {
      locked.current = true;
      setPhase("blocked");
      setMessage(
        "Não é possível reativar esta conta com os dados disponíveis. Atualize o catálogo.",
      );
      return;
    }
    const selectedReason = currentReason.current;
    if (target.authenticationMethod === "Local" && !selectedReason) {
      setReasonError("Selecione o motivo da reativação.");
      return;
    }
    busy.current = true;
    locked.current = true;
    legacyRefusal.current = false;
    setPhase("submitting");
    setMessage(null);
    setReasonError(null);
    const request = epoch.current;
    try {
      if (target.authenticationMethod === "Local") {
        const result = await reactivateLocalAccount(
          target.id,
          selectedReason as CredentialResetReason,
        );
        if (!alive.current || closed.current || request !== epoch.current)
          return;
        setCredential(result);
        setPhase("credential");
      } else {
        await reactivateGoogleAccount(target.id);
        if (!alive.current || closed.current || request !== epoch.current)
          return;
        setPhase("completed");
        setMessage("Conta Google reativada. Nenhuma senha local foi criada.");
      }
    } catch (error) {
      if (!alive.current || closed.current || request !== epoch.current) return;
      const failure = reactivationFailure(error);
      legacyRefusal.current =
        error instanceof LocalReactivationResetRequiredError;
      if (failure.kind === "retryable") locked.current = false;
      setReasonError(failure.reasonError);
      setMessage(failure.message);
      setPhase(failure.kind === "retryable" ? "editing" : failure.kind);
    } finally {
      if (request === epoch.current) busy.current = false;
    }
  }

  async function reconcile() {
    if (
      !alive.current ||
      closed.current ||
      busy.current ||
      !locked.current ||
      phase !== "reconcile"
    )
      return;
    busy.current = true;
    setPhase("reading");
    const request = epoch.current;
    try {
      const observed = await readAccount(current.current);
      if (!alive.current || closed.current || request !== epoch.current) return;
      if (
        !observed ||
        observed.id !== current.current.id ||
        typeof observed.active !== "boolean" ||
        typeof observed.name !== "string" ||
        (observed.authenticationMethod !== "Local" &&
          observed.authenticationMethod !== "Google")
      ) {
        setMessage(
          "Não foi possível confirmar o estado desta conta. Não repita a reativação; consulte novamente ou peça verificação administrativa.",
        );
      } else {
        const canonical: ReactivationAccount = {
          id: observed.id,
          name: observed.name,
          active: observed.active,
          authenticationMethod: observed.authenticationMethod,
        };
        current.current = canonical;
        setAccount(canonical);
        setMessage(
          canonical.active
            ? canonical.authenticationMethod === "Local"
              ? "A conta está ativa, mas isso não confirma o recebimento da credencial. Feche esta janela e use Redefinir credencial na conta ativa, com nova confirmação explícita."
              : "A conta está ativa. A consulta não confirma qual tentativa realizou a reativação. Nenhuma senha local será criada."
            : legacyRefusal.current
              ? "A conta continua inativa. A reativação simples foi recusada. Feche esta janela, atualize o catálogo e inicie uma nova confirmação com o método canônico e, para conta Local, motivo e nova credencial."
              : "A conta aparece inativa nesta consulta. Isso não comprova que o envio anterior foi desfeito. Não repita a reativação; consulte novamente ou peça verificação administrativa.",
        );
      }
    } catch {
      if (alive.current && !closed.current && request === epoch.current)
        setMessage(
          "Não foi possível consultar o estado da conta. Nenhuma reativação foi reenviada.",
        );
    } finally {
      if (alive.current && !closed.current && request === epoch.current) {
        busy.current = false;
        setPhase("reconcile");
      }
    }
  }

  function close() {
    if (busy.current) return false;
    closed.current = true;
    locked.current = true;
    epoch.current++;
    setCredential(null);
    setReason("");
    currentReason.current = "";
    setReasonError(null);
    setMessage(null);
    setPhase("closed");
    return true;
  }

  return {
    account,
    reason,
    reasonError,
    message,
    credential,
    phase,
    changeReason,
    confirm,
    reconcile,
    close,
  };
}
