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
      className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div>
        <label
          className="block text-xs font-bold text-ink-soft"
          htmlFor="summary-date"
        >
          Data do resumo
        </label>
        <TextField
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : "false"}
          className="mt-1 text-sm sm:w-44"
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
