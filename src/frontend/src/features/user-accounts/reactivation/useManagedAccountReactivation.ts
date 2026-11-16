import { useEffect, useRef, useState } from "react";
import type { UserAccount } from "../types";
import type { ReactivationCloseOutcome } from "./types";

interface Options {
  pendingAction: string | null;
  ready: boolean;
  loading: boolean;
  setPendingAction: (action: string | null) => void;
  onReload: (message?: string) => Promise<void>;
  onOpen: () => void;
}

export function useManagedAccountReactivation(options: Options) {
  const [target, setTarget] = useState<{
    account: UserAccount;
    trigger: HTMLElement | null;
  } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const openRef = useRef(false);
  const uncertainAccounts = useRef(new Set<number>());
  const focusAfterRead = useRef<{
    id: number;
    trigger: HTMLElement | null;
  } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (options.loading || options.pendingAction || target) return;
    const intent = focusAfterRead.current;
    if (!intent) return;
    focusAfterRead.current = null;
    const frame = window.requestAnimationFrame(() => {
      if (document.querySelector('[role="dialog"]')) return;
      // Preserve purposeful feedback focus instead of stealing it.
      const active = document.activeElement;
      if (
        active &&
        active !== document.body &&
        active.isConnected &&
        !active.matches(":disabled")
      )
        return;
      const fallback = document.querySelector<HTMLElement>(
        `[data-reset-account-id="${intent.id}"], [data-toggle-account-id="${intent.id}"]`,
      );
      const trigger = intent.trigger?.isConnected ? intent.trigger : fallback;
      const destination =
        trigger && !trigger.matches(":disabled")
          ? trigger
          : document.querySelector<HTMLElement>("[data-account-catalog-focus]");
      destination?.focus();
      destination?.scrollIntoView?.({ block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [options.loading, options.pendingAction, target]);

  function open(account: UserAccount, trigger: HTMLElement | null = null) {
    if (
      openRef.current ||
      options.pendingAction ||
      !options.ready ||
      account.active
    )
      return;
    if (uncertainAccounts.current.has(account.id)) {
      setWarning(
        "O resultado anterior desta conta continua incerto. Não repita a reativação. Consulte a lista; se estiver ativa e precisar de uma credencial, use Redefinir credencial com nova confirmação.",
      );
      return;
    }
    openRef.current = true;
    setWarning(null);
    options.onOpen();
    options.setPendingAction(`reactivation-${account.id}`);
    setTarget({ account, trigger });
  }

  function close(outcome: ReactivationCloseOutcome) {
    if (!target) return;
    const previous = target;
    setTarget(null);
    if (outcome === "cancelled") {
      openRef.current = false;
      options.setPendingAction(null);
      return;
    }
    if (outcome === "refresh-required") {
      setWarning(
        "A reativação simples foi recusada. O catálogo foi solicitado novamente; confira o método atual e inicie somente uma nova confirmação explícita, com motivo e nova credencial para conta Local.",
      );
    }
    if (outcome === "uncertain") {
      uncertainAccounts.current.add(previous.account.id);
      setWarning(
        "O resultado da reativação não foi confirmado. A consulta não reenvia a operação. Conta ativa não comprova recebimento da credencial: use Redefinir credencial somente por nova confirmação explícita, se necessário.",
      );
    }
    focusAfterRead.current = {
      id: previous.account.id,
      trigger: previous.trigger,
    };
    const message =
      outcome === "confirmed"
        ? previous.account.authenticationMethod === "Google"
          ? "Conta Google reativada. Nenhuma senha local foi criada."
          : "Conta Local reativada. A credencial temporária foi exibida uma única vez; entregue-a pelo procedimento protegido."
        : undefined;
    void options.onReload(message).finally(() => {
      if (!alive.current) return;
      openRef.current = false;
      options.setPendingAction(null);
    });
  }

  return { target, warning, open, close };
}
