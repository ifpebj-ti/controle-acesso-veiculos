import type { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";

export type MetricCardTone =
  "amber" | "forest" | "leaf" | "red" | "sage" | "teal";

interface MetricCardProps {
  description: string;
  icon: IconName;
  label: string;
  tone?: MetricCardTone;
  value: ReactNode;
}

export function MetricCard({
  description,
  icon,
  label,
  tone = "forest",
  value,
}: MetricCardProps) {
  const hasCompactValue = typeof value === "string" && value.trim().length >= 8;

  return (
    <article
      className="institutional-metric"
      data-compact-value={hasCompactValue ? "true" : undefined}
      data-tone={tone}
    >
      <span className="institutional-metric__icon" aria-hidden="true">
        <Icon name={icon} size={23} />
      </span>
      <div className="min-w-0">
        <p className="institutional-metric__label text-sm font-semibold leading-5 text-text-muted">
          {label}
        </p>
        <p className="institutional-metric__value mt-1 leading-none tabular-nums text-text">
          {value}
        </p>
        <p className="mt-1.5 text-xs leading-5 text-text-muted">
          {description}
        </p>
      </div>
    </article>
  );
}
