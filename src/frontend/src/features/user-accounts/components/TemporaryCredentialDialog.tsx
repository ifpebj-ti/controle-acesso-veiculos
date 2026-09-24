import { useEffect, useRef, useState } from "react";

import type { TemporaryCredential } from "../types";

interface TemporaryCredentialDialogProps {
  accountId?: number;
  accountName: string;
  credential: TemporaryCredential;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}

const expirationFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function TemporaryCredentialDialog({
  accountId,
  accountName,
  credential,
  onClose,
  returnFocusTo,
}: TemporaryCredentialDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
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
        if (dialog?.isConnected) return;
        const fallback = accountId
          ? document.querySelector<HTMLElement>(
              `[data-reset-account-id="${accountId}"]`,
            )
          : null;
        if (returnFocusTo?.isConnected) {
          returnFocusTo.focus();
        } else {
          fallback?.focus();
        }
      });
    };
  }, [accountId, returnFocusTo]);

  async function copyCredential() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("unavailable");
      await navigator.clipboard.writeText(credential.temporaryCredential);
      setCopyMessage("Credencial copiada.");
    } catch {
      setCopyMessage(
        "Não foi possível copiar. Selecione a credencial e copie manualmente.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-ink/55 p-0 sm:items-center sm:p-6">
      <div
        aria-describedby="temporary-credential-description"
        aria-labelledby="temporary-credential-title"
        aria-modal="true"
        className="w-full rounded-t-[2rem] bg-white p-5 shadow-2xl sm:mx-auto sm:max-w-xl sm:rounded-[2rem] sm:p-7"
        ref={dialogRef}
        role="dialog"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Exibição única
        </p>
        <h2
          className="mt-3 font-display text-3xl text-ink outline-none"
          id="temporary-credential-title"
          ref={titleRef}
          tabIndex={-1}
        >
          Credencial temporária criada
        </h2>
        <div
          className="mt-4 space-y-2 text-sm leading-6 text-ink-soft"
          id="temporary-credential-description"
        >
          <p>
            Repasse esta credencial para <strong>{accountName}</strong> pelo
            procedimento institucional definido pelo campus.
          </p>
          <p className="font-semibold text-ink">
            Depois de fechar esta janela, a credencial não poderá ser
            recuperada.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-ink/15 bg-cream/55 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            Credencial temporária
          </p>
          <output className="mt-2 block break-all font-mono text-lg font-bold text-ink">
            {credential.temporaryCredential}
          </output>
          <p className="mt-3 text-sm text-ink-soft">
            Válida até{" "}
            {expirationFormatter.format(
              new Date(credential.temporaryCredentialExpiresAtUtc),
            )}
            .
          </p>
        </div>

        <p
          aria-live="polite"
          className="mt-3 min-h-6 text-sm text-ink"
          role="status"
        >
          {copyMessage}
        </p>

        <div className="mt-4 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
          <button
            className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Fechar e apagar da tela
          </button>
          <button
            className="min-h-12 rounded-xl bg-brand-dark px-6 font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/45"
            onClick={() => void copyCredential()}
            type="button"
          >
            Copiar credencial
          </button>
        </div>
      </div>
    </div>
  );
}
