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

  return (
    <div
      aria-describedby={statusId}
      aria-labelledby={labelId}
      className={`appearance-selector min-w-0 rounded-2xl border border-border bg-surface-subtle p-2.5 ${className}`}
      role="group"
    >
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <p
          className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted"
          id={labelId}
        >
          Aparência
        </p>
        <span
          aria-hidden="true"
          className="appearance-selector-mark"
          data-resolved-theme={resolvedTheme}
        />
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
        aplicado: {resolvedTheme === "dark" ? "Escuro" : "Claro"}.
      </p>
    </div>
  );
}
