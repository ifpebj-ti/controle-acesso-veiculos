interface SummaryDateFilterProps {
  date: string;
  disabled: boolean;
  error: string | null;
  onApply: () => void;
  onChange: (date: string) => void;
}

export function SummaryDateFilter({
  date,
  disabled,
  error,
  onApply,
  onChange,
}: SummaryDateFilterProps) {
  const errorId = "operational-summary-date-error";

  return (
    <form
      className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div>
        <label
          className="block text-xs font-bold text-ink/70"
          htmlFor="summary-date"
        >
          Data do resumo
        </label>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : "false"}
          className="mt-1 min-h-11 w-full rounded-xl border border-ink/20 bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/20 disabled:cursor-wait disabled:opacity-60 sm:w-44"
          disabled={disabled}
          id="summary-date"
          onChange={(event) => onChange(event.target.value)}
          type="date"
          value={date}
        />
        {error && (
          <p className="mt-1 text-xs font-semibold text-red-700" id={errorId}>
            {error}
          </p>
        )}
      </div>
      <button
        className="min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30 disabled:cursor-wait disabled:opacity-60"
        disabled={disabled}
        type="submit"
      >
        Atualizar resumo
      </button>
    </form>
  );
}
