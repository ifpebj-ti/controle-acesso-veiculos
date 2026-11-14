import { useEffect, useRef } from "react";
import { ActionFeedback } from "../../../components/ui/ActionFeedback";
import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TemporaryCredentialDialog } from "../components/TemporaryCredentialDialog";
import { credentialResetReasons } from "../types";
import type {
  ReactivationAccount,
  ReadReactivationAccount,
  ReactivationCloseOutcome,
} from "./types";
import { useAccountReactivation } from "./useAccountReactivation";

interface Props {
  account: ReactivationAccount;
  readAccount: ReadReactivationAccount;
  onClose: (outcome: ReactivationCloseOutcome) => void;
  returnFocusTo: HTMLElement | null;
}

// Receives only a validated canonical account and an independent catalog reader.
export function AccountReactivationFlow(props: Props) {
  return <ReactivationSession key={props.account.id} {...props} />;
}

const reasonLabels = {
  Esquecimento: "Esquecimento",
  SuspeitaComprometimento: "Suspeita de comprometimento",
  ProvisionamentoCorretivo: "Provisionamento corretivo",
} as const;

function ReactivationSession({
  account: initialAccount,
  readAccount,
  onClose,
  returnFocusTo,
}: Props) {
  const flow = useAccountReactivation(initialAccount, readAccount);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const readRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(() => {});
  const busy = flow.phase === "submitting" || flow.phase === "reading";
  const local = flow.account.authenticationMethod === "Local";
  const knownMethod = local || flow.account.authenticationMethod === "Google";
  const canConfirm =
    flow.phase === "editing" && !flow.account.active && knownMethod;

  function close() {
    const outcome = flow.getCloseOutcome();
    if (!flow.close()) return;
    onClose(outcome);
    window.requestAnimationFrame(() => {
      if (
        returnFocusTo?.isConnected &&
        !document.querySelector('[role="dialog"]')
      )
        returnFocusTo.focus();
    });
  }
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    const dialog = dialogRef.current;
    cancelRef.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        !dialogRef.current?.contains(event.target as Node)
      )
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.closest('[hidden], [inert], [aria-hidden="true"]'),
      );
      const first = controls[0],
        last = controls.at(-1);
      if (!first) {
        event.preventDefault();
        dialogRef.current.focus();
      } else if (document.activeElement === dialogRef.current) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.requestAnimationFrame(() => {
        if (
          !dialog?.isConnected &&
          returnFocusTo?.isConnected &&
          !document.querySelector('[role="dialog"]')
        )
          returnFocusTo.focus();
      });
    };
  }, [returnFocusTo]);
  useEffect(() => {
    if (flow.reasonError)
      document.getElementById("account-reactivation-reason")?.focus();
  }, [flow.reasonError]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusNeedsRecovery =
      !dialog.contains(document.activeElement) ||
      document.activeElement === dialog ||
      document.activeElement?.matches(":disabled");
    if (busy && focusNeedsRecovery) dialog.focus();
    if (flow.phase === "reconcile" && focusNeedsRecovery)
      readRef.current?.focus();
    if (
      (flow.phase === "completed" || flow.phase === "blocked") &&
      focusNeedsRecovery
    )
      cancelRef.current?.focus();
    if (flow.phase === "editing" && focusNeedsRecovery)
      cancelRef.current?.focus();
  }, [flow.phase, busy]);

  if (flow.phase === "closed") return null;
  if (flow.credential) {
    return (
      <div className="[&_[role=dialog]]:max-h-[90svh] [&_[role=dialog]]:overflow-y-auto">
        <TemporaryCredentialDialog
          accountId={flow.account.id}
          accountName={flow.account.name}
          credential={flow.credential}
          onClose={close}
          returnFocusTo={returnFocusTo}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end overflow-y-auto bg-overlay p-0 sm:items-center sm:p-6">
      <div
        aria-describedby="account-reactivation-description"
        aria-labelledby="account-reactivation-title"
        aria-modal="true"
        className="max-h-[90svh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 text-text shadow-2xl sm:mx-auto sm:max-w-xl sm:rounded-3xl sm:p-7"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <h2 className="text-2xl font-bold" id="account-reactivation-title">
          {local
            ? "Reativar com nova credencial?"
            : knownMethod
              ? "Reativar conta Google?"
              : "Reativação indisponível"}
        </h2>
        <div
          className="mt-4 space-y-2 text-sm leading-6 text-text-muted"
          id="account-reactivation-description"
        >
          <p>
            Conta: <strong className="break-all">{flow.account.name}</strong>.
          </p>
          {!knownMethod ? (
            <p>
              Não foi possível verificar o método de autenticação. Atualize o
              catálogo.
            </p>
          ) : local ? (
            <>
              <p>
                A reativação invalida a credencial local anterior, encerra
                sessões anteriores e gera uma credencial temporária, exibida uma
                única vez.
              </p>
              <p>
                Entregue-a diretamente ao titular pelo procedimento protegido do
                campus. No primeiro acesso será exigida a troca da senha.
              </p>
            </>
          ) : (
            <p>
              A conta voltará a ficar ativa mantendo o acesso pelo Google.
              Nenhuma senha local será criada ou alterada.
            </p>
          )}
          {flow.account.active && (
            <p>A conta consultada já está ativa. Não envie outra reativação.</p>
          )}
        </div>
        <form
          className="mt-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void flow.confirm();
          }}
        >
          {local && (
            <>
              <label
                className="text-sm font-semibold"
                htmlFor="account-reactivation-reason"
              >
                Motivo da reativação
              </label>
              <SelectField
                id="account-reactivation-reason"
                className="ui-field mt-2"
                value={flow.reason}
                onValueChange={flow.changeReason}
                disabled={!canConfirm || busy}
                required
                placeholder="Selecione um motivo"
                options={credentialResetReasons.map((value) => ({
                  value,
                  label: reasonLabels[value],
                }))}
                aria-invalid={Boolean(flow.reasonError)}
                aria-describedby={
                  flow.reasonError
                    ? "account-reactivation-reason-error"
                    : undefined
                }
              />
              {flow.reasonError && (
                <p
                  className="mt-2 text-sm text-danger-text"
                  id="account-reactivation-reason-error"
                  role="alert"
                >
                  {flow.reasonError}
                </p>
              )}
            </>
          )}
          <ActionFeedback
            className="mt-4"
            tone={flow.phase === "completed" ? "success" : "error"}
            message={flow.message === flow.reasonError ? null : flow.message}
          />
          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-border pt-4">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={close}
              ref={cancelRef}
            >
              {flow.phase === "editing" ? "Cancelar" : "Fechar"}
            </Button>
            {(flow.phase === "reconcile" || flow.phase === "reading") && (
              <Button
                disabled={busy}
                onClick={() => void flow.reconcile()}
                ref={readRef}
              >
                {flow.phase === "reading"
                  ? "Consultando…"
                  : "Atualizar estado da conta"}
              </Button>
            )}
            {knownMethod &&
              !flow.account.active &&
              (flow.phase === "editing" || flow.phase === "submitting") && (
                <Button type="submit" disabled={!canConfirm || busy}>
                  {busy
                    ? "Reativando…"
                    : local
                      ? "Confirmar reativação com nova credencial"
                      : "Confirmar reativação Google"}
                </Button>
              )}
          </div>
        </form>
      </div>
    </div>
  );
}
