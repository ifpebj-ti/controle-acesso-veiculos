import { useId } from "react";

import { useAppearance } from "./useAppearance";
import type { AppearancePreference } from "./types";

const options: Array<{ label: string; value: AppearancePreference }> = [
  { label: "Claro", value: "light" },
  { label: "Escuro", value: "dark" },
  { label: "Sistema", value: "system" },
];

export function AppearanceSelector({ className = "" }: { className?: string }) {
  const { preference, resolvedTheme, setPreference } = useAppearance();
  const statusId = useId();

  return (
    <fieldset className={`appearance-selector min-w-0 ${className}`}>
      <legend className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
        Aparência
      </legend>
      <div
        aria-describedby={statusId}
        className="mt-2 grid grid-cols-3 rounded-xl border border-border bg-surface p-1"
      >
        {options.map((option) => (
          <button
            aria-pressed={preference === option.value}
            className="appearance-selector-option min-h-11 rounded-lg px-2 text-xs font-bold text-text"
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
    </fieldset>
  );
}
