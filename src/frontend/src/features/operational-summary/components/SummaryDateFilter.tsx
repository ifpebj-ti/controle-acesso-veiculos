import { Button } from "../../../components/ui/Button";
import { TextField } from "../../../components/ui/TextField";

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
      className="flex min-w-0 w-full max-w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className="min-w-0 max-w-full">
        <label
          className="block text-xs font-bold text-ink-soft"
          htmlFor="summary-date"
        >
          Data do resumo
        </label>
        <TextField
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : "false"}
          className="mt-1 block max-w-full text-sm sm:w-44"
          disabled={disabled}
          id="summary-date"
          onChange={(event) => onChange(event.target.value)}
          type="date"
          value={date}
        />
        {error && (
          <p
            className="mt-1 text-xs font-semibold text-danger-text"
            id={errorId}
          >
            {error}
          </p>
        )}
      </div>
      <Button disabled={disabled} type="submit">
        Atualizar resumo
      </Button>
    </form>
  );
}
