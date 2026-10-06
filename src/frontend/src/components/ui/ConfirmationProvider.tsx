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
import { Button } from "./Button";

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
    <div className="fixed inset-0 z-[70] grid items-end bg-overlay p-4 sm:items-center sm:p-6">
      <div
        aria-describedby="confirmation-dialog-description"
        aria-labelledby="confirmation-dialog-title"
        aria-modal="true"
        className="mx-auto max-h-[calc(100dvh-3rem)] w-full min-w-0 max-w-lg overflow-y-auto break-words rounded-2xl border border-border bg-surface-raised p-5 text-text shadow-lg shadow-shadow sm:p-6"
        ref={dialogRef}
        role="alertdialog"
      >
        <p className="text-sm font-semibold text-text-muted">
          {options.eyebrow ?? "Confirme a ação"}
        </p>
        <h2
          className="mt-2 text-2xl font-semibold leading-tight text-text"
          id="confirmation-dialog-title"
        >
          {options.title}
        </h2>
        <p
          className="mt-3 text-base leading-6 text-text-muted"
          id="confirmation-dialog-description"
        >
          {options.description}
        </p>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Manter como está
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            type="button"
          >
            {options.confirmLabel}
          </Button>
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
