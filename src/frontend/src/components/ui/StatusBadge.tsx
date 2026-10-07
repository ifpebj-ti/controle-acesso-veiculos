interface StatusBadgeProps {
  label: string;
  tone?: "danger" | "success" | "warning" | "neutral";
}

const tones = {
  danger: "bg-danger-surface text-danger-text border-danger-border",
  neutral: "bg-surface-subtle text-text border-border",
  success: "bg-success-surface text-success-text border-success-border",
  warning: "bg-warning-surface text-warning-text border-warning-border",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 break-words rounded-full border px-2.5 py-1 text-sm font-semibold ${tones[tone]}`}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-current"
      />
      <span className="min-w-0">{label}</span>
    </span>
  );
}
