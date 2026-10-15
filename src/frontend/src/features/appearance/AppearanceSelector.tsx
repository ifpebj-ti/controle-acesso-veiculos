import { useId } from "react";

import { useAppearance } from "./useAppearance";
import type { AppearancePreference } from "./types";

const options: Array<{ label: string; value: AppearancePreference }> = [
  { label: "Claro", value: "light" },
  { label: "Escuro", value: "dark" },
  { label: "Automático", value: "system" },
];

export function AppearanceSelector({ className = "" }: { className?: string }) {
  const { preference, resolvedTheme, setPreference } = useAppearance();
  const labelId = useId();
  const statusId = useId();
  const resolvedThemeLabel = resolvedTheme === "dark" ? "Escuro" : "Claro";

  return (
    <div
      aria-describedby={statusId}
      aria-labelledby={labelId}
      className={`appearance-selector min-w-0 rounded-2xl border border-border bg-surface-subtle p-2.5 ${className}`}
      role="group"
    >
      <div className="flex items-center justify-between gap-3 px-1 pb-2.5">
        <div className="min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted"
            id={labelId}
          >
            Aparência
          </p>
          <p aria-hidden="true" className="mt-0.5 text-xs text-ink-soft">
            {preference === "system"
              ? `Dispositivo · ${resolvedThemeLabel}`
              : `Tema ${resolvedThemeLabel}`}
          </p>
        </div>
        <svg
          aria-hidden="true"
          className="appearance-selector-mark"
          data-preference={preference}
          data-resolved-theme={resolvedTheme}
          focusable="false"
          viewBox="0 0 96 64"
        >
          <g className="appearance-brand-line">
            <path d="M20 13a11 11 0 0 1 22 0" />
            <path d="M8 14h43v5H8z" />
            <path d="M11 19v40h38V19" />
            <path d="M17 25h26v19H17z" />
            <circle cx="30" cy="32" r="3.5" />
            <path d="M24.5 42v-4.5a5.5 5.5 0 0 1 11 0V42" />
            <path d="M20 49h20M23 53h14" />
            <path d="M49 34h8v25h-8" />
            <path d="M7 59h53" />
          </g>
          <g className="appearance-gate-barrier">
            <rect
              className="appearance-gate-arm"
              height="6"
              rx="2"
              width="35"
              x="55"
              y="35"
            />
            <path className="appearance-gate-stripes" d="m65 36 4 4m8-4 4 4" />
          </g>
          <circle className="appearance-gate-pivot" cx="56" cy="38" r="3.5" />
        </svg>
      </div>
      <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1.3fr)] gap-1 rounded-xl border border-border bg-surface p-1">
        {options.map((option) => (
          <button
            aria-pressed={preference === option.value}
            className="appearance-selector-option min-h-11 min-w-0 rounded-lg px-1 text-[0.72rem] font-bold text-text"
            key={option.value}
            onClick={() => setPreference(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="sr-only" id={statusId} role="status">
        Preferência{" "}
        {options.find((option) => option.value === preference)?.label}. Tema
        aplicado: {resolvedThemeLabel}.
      </p>
    </div>
  );
}
