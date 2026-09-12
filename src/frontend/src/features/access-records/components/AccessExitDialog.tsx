import { useEffect, useRef, type RefObject } from "react";

import type { AccessRecord } from "../types";

interface AccessExitDialogProps {
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  record: AccessRecord;
  returnFocusTo: HTMLElement | null;
  successFocusRef: RefObject<HTMLElement | null>;
}

export function AccessExitDialog({
  errorMessage,
  onCancel,
  onConfirm,
  pending,
  record,
  returnFocusTo,
  successFocusRef,
}: AccessExitDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef(onCancel);
  const pendingRef = useRef(pending);

  useEffect(() => {
    cancelRef.current = onCancel;
    pendingRef.current = pending;
  }, [onCancel, pending]);

  useEffect(() => {
    const successFocusTarget = successFocusRef.current;
    const dialogElement = dialogRef.current;
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!pendingRef.current) {
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
      const target = returnFocusTo?.isConnected
        ? returnFocusTo
        : successFocusTarget;
      window.requestAnimationFrame(() => {
        if (dialogElement?.isConnected) return;
        target?.focus();
      });
    };
  }, [returnFocusTo, successFocusRef]);

  function confirm() {
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-ink/55 p-0 sm:items-center sm:p-6">
      <div
        aria-describedby="access-exit-description"
        aria-labelledby="access-exit-title"
        aria-modal="true"
        className="w-full rounded-t-[2rem] bg-white p-5 shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-[2rem] sm:p-7"
        ref={dialogRef}
        role="dialog"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Conferência manual
        </p>
        <h2
          className="mt-1 font-display text-3xl text-ink"
          id="access-exit-title"
        >
          Registrar saída?
        </h2>
        <p
          className="mt-4 text-sm leading-6 text-ink/70"
          id="access-exit-description"
        >
          Confirme a saída do veículo <strong>{record.plate}</strong>, conduzido
          por <strong>{record.driverName}</strong>.
        </p>

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
            disabled={pending}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="min-h-12 rounded-xl bg-brand-dark px-6 font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/45 disabled:cursor-wait disabled:opacity-65"
            disabled={pending}
            onClick={confirm}
            type="button"
          >
            {pending ? "Registrando saída…" : "Confirmar saída"}
          </button>
        </div>
      </div>
    </div>
  );
}
