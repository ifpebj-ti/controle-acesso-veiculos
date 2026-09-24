import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ConfirmationContext,
  type ConfirmationOptions,
  type RequestConfirmation,
} from "./confirmationContext";

interface ConfirmationRequest {
  options: ConfirmationOptions;
  resolve: (confirmed: boolean) => void;
  returnFocusTo: HTMLElement | null;
}

function ConfirmationDialog({
  onCancel,
  onConfirm,
  options,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  options: ConfirmationOptions;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const tone = options.tone ?? "danger";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
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
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[70] grid items-end bg-ink/55 p-0 sm:items-center sm:p-6">
      <div
        aria-describedby="confirmation-dialog-description"
        aria-labelledby="confirmation-dialog-title"
        aria-modal="true"
        className="w-full rounded-t-[2rem] bg-white p-5 shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-[2rem] sm:p-7"
        ref={dialogRef}
        role="alertdialog"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          {options.eyebrow ?? "Confirme a ação"}
        </p>
        <h2
          className="mt-3 font-display text-3xl text-ink"
          id="confirmation-dialog-title"
        >
          {options.title}
        </h2>
        <p
          className="mt-4 text-sm leading-6 text-ink-soft"
          id="confirmation-dialog-description"
        >
          {options.description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
          <button
            className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink transition-colors hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Manter como está
          </button>
          <button
            className={`min-h-12 rounded-xl px-6 font-bold text-white transition-colors focus:outline-none focus-visible:ring-3 ${
              tone === "danger"
                ? "bg-red-800 hover:bg-red-900 focus-visible:ring-red-700/35"
                : "bg-brand-dark hover:bg-ink focus-visible:ring-brand/45"
            }`}
            onClick={onConfirm}
            type="button"
          >
            {options.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const activeRequest = useRef<ConfirmationRequest | null>(null);
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);

  const requestConfirmation = useCallback<RequestConfirmation>((options) => {
    if (activeRequest.current) return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      const nextRequest = {
        options,
        resolve,
        returnFocusTo:
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null,
      };
      activeRequest.current = nextRequest;
      setRequest(nextRequest);
    });
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    const current = activeRequest.current;
    if (!current) return;

    activeRequest.current = null;
    setRequest(null);
    current.resolve(confirmed);
    window.requestAnimationFrame(() => {
      if (current.returnFocusTo?.isConnected) current.returnFocusTo.focus();
    });
  }, []);

  useEffect(
    () => () => {
      activeRequest.current?.resolve(false);
      activeRequest.current = null;
    },
    [],
  );

  return (
    <ConfirmationContext.Provider value={requestConfirmation}>
      {children}
      {request && (
        <ConfirmationDialog
          onCancel={() => settle(false)}
          onConfirm={() => settle(true)}
          options={request.options}
        />
      )}
    </ConfirmationContext.Provider>
  );
}
