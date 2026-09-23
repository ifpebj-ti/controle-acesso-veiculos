import { useEffect, useRef, useState, type FormEvent } from "react";

import { SelectField } from "../../../components/ui/SelectField";
import {
  credentialResetReasons,
  type CredentialResetReason,
  type UserAccount,
} from "../types";

interface CredentialResetDialogProps {
  account: UserAccount;
  busy: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: (reason: CredentialResetReason) => void;
  returnFocusTo: HTMLElement | null;
}

const reasonLabels: Record<CredentialResetReason, string> = {
  Esquecimento: "Esquecimento",
  ProvisionamentoCorretivo: "Provisionamento corretivo",
  SuspeitaComprometimento: "Suspeita de comprometimento",
};

export function CredentialResetDialog({
  account,
  busy,
  errorMessage,
  onCancel,
  onConfirm,
  returnFocusTo,
}: CredentialResetDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef(onCancel);
  const busyRef = useRef(busy);
  const [reason, setReason] = useState<CredentialResetReason | "">("");
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    cancelRef.current = onCancel;
    busyRef.current = busy;
  }, [busy, onCancel]);

  useEffect(() => {
    const dialog = dialogRef.current;
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!busyRef.current) {
          event.preventDefault();
          cancelRef.current();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => {
        if (
          !busyRef.current &&
          !dialog?.isConnected &&
          returnFocusTo?.isConnected
        ) {
          returnFocusTo.focus();
        }
      });
    };
  }, [returnFocusTo]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason) {
      setReasonError("Selecione o motivo da redefinição.");
      return;
    }
    onConfirm(reason);
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-ink/55 p-0 sm:items-center sm:p-6">
      <div
        aria-describedby="credential-reset-description"
        aria-labelledby="credential-reset-title"
        aria-modal="true"
        className="w-full rounded-t-[2rem] bg-white p-5 shadow-2xl sm:mx-auto sm:max-w-xl sm:rounded-[2rem] sm:p-7"
        ref={dialogRef}
        role="dialog"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Ação administrativa
        </p>
        <h2
          className="mt-3 font-display text-3xl text-ink outline-none"
          id="credential-reset-title"
          ref={titleRef}
          tabIndex={-1}
        >
          Redefinir credencial?
        </h2>
        <div
          className="mt-4 text-sm leading-6 text-ink-soft"
          id="credential-reset-description"
        >
          <p>
            A conta de <strong>{account.name}</strong> receberá uma nova
            credencial temporária. Ao confirmar:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>as sessões anteriores serão encerradas;</li>
            <li>a credencial temporária anterior será invalidada;</li>
            <li>uma nova troca obrigatória será exigida.</li>
          </ul>
        </div>

        <form className="mt-5" noValidate onSubmit={submit}>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="credential-reset-reason"
          >
            Motivo da redefinição
          </label>
          <SelectField
            aria-describedby={
              reasonError ? "credential-reset-reason-error" : undefined
            }
            aria-invalid={Boolean(reasonError)}
            className="mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20 disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            id="credential-reset-reason"
            onValueChange={(value) => {
              setReason(value as CredentialResetReason | "");
              setReasonError("");
            }}
            options={credentialResetReasons.map((value) => ({
              label: reasonLabels[value],
              value,
            }))}
            placeholder="Selecione um motivo"
            required
            value={reason}
          />
          {reasonError && (
            <p
              className="mt-1.5 text-sm text-red-800"
              id="credential-reset-reason-error"
            >
              {reasonError}
            </p>
          )}
          {errorMessage && (
            <div
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
            <button
              className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-50"
              disabled={busy}
              onClick={onCancel}
              ref={cancelButtonRef}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="min-h-12 rounded-xl bg-brand-dark px-6 font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/45 disabled:cursor-wait disabled:opacity-65"
              disabled={busy}
              type="submit"
            >
              {busy ? "Redefinindo…" : "Confirmar redefinição"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
