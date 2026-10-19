import { useEffect, useRef } from "react";

import { Icon } from "./Icon";

interface ActionFeedbackProps {
  className?: string;
  floating?: boolean;
  focusOnChange?: boolean;
  message?: string | null;
  onDismiss?: () => void;
  tone: "error" | "success";
}

export function ActionFeedback({
  className = "",
  floating = false,
  focusOnChange = false,
  message,
  onDismiss,
  tone,
}: ActionFeedbackProps) {
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && focusOnChange) {
      feedbackRef.current?.focus({ preventScroll: true });
    }
  }, [focusOnChange, message]);

  if (!message) return null;

  const error = tone === "error";
  return (
    <div
      aria-atomic="true"
      aria-live={error ? "assertive" : "polite"}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
        floating
          ? "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 max-h-[min(50vh,20rem)] overflow-auto shadow-lg md:left-auto md:max-w-xl"
          : "relative"
      } ${
        error
          ? "border-danger-border bg-danger-surface text-danger-text"
          : "border-success-border bg-success-surface text-success-text"
      } ${className}`}
      ref={feedbackRef}
      role={error ? "alert" : "status"}
      tabIndex={focusOnChange ? -1 : undefined}
    >
      <Icon
        className="mt-0.5 shrink-0"
        name={error ? "shield" : "clipboard"}
        size={18}
      />
      <p className="min-w-0 flex-1 break-words">{message}</p>
      {onDismiss && (
        <button
          aria-label="Fechar mensagem"
          className="min-h-10 shrink-0 rounded-lg px-2 font-bold underline underline-offset-4 focus:outline-none focus-visible:ring-3 focus-visible:ring-focus"
          onClick={onDismiss}
          type="button"
        >
          Fechar
        </button>
      )}
    </div>
  );
}
