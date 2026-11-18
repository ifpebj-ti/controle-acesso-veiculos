import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "../../components/ui/Button";

export function CorrectionDialog({
  title,
  onClose,
  returnFocusTo,
  children,
}: {
  title: string;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
  children: ReactNode;
}) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const existingError =
      root.current?.querySelector<HTMLElement>('[role="alert"]');
    (existingError ?? heading.current)?.focus();
    existingError?.scrollIntoView?.({ block: "nearest" });
    const restore: Array<[HTMLElement, boolean]> = [];
    let branch: HTMLElement | null = root.current?.parentElement ?? null;
    while (branch?.parentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (sibling instanceof HTMLElement && sibling !== branch) {
          restore.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = root.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === heading.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener("keydown", keyboard);
      restore.forEach(([element, inert]) => {
        element.inert = inert;
      });
      requestAnimationFrame(() => {
        if (returnFocusTo?.isConnected) returnFocusTo.focus();
      });
    };
  }, [returnFocusTo]);
  return (
    <div className="fixed inset-0 z-50 grid items-end overflow-y-auto bg-overlay sm:items-center sm:p-6">
      <section
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="max-h-[100svh] w-full overflow-y-auto rounded-t-xl border border-border bg-surface p-5 shadow-xl sm:mx-auto sm:max-h-[calc(100svh-3rem)] sm:max-w-3xl sm:rounded-xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            ref={heading}
            tabIndex={-1}
            id={id}
            className="text-2xl font-bold text-text"
          >
            {title}
          </h2>
          <Button
            aria-label="Fechar janela de correção"
            className="size-12 shrink-0 p-0 text-xl"
            variant="secondary"
            onClick={onClose}
          >
            ×
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
