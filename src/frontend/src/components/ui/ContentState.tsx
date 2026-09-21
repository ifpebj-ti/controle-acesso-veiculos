import type { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";

type ContentStateVariant = "empty" | "error" | "loading";

interface ContentStateProps {
  action?: ReactNode;
  className?: string;
  description?: string;
  icon?: IconName;
  title: string;
  variant: ContentStateVariant;
}

const surfaces: Record<ContentStateVariant, string> = {
  empty: "border-dashed border-ink/20 bg-cream/40",
  error: "border-red-200 bg-red-50 text-red-900",
  loading: "border-ink/8 bg-cream/50",
};

export function ContentState({
  action,
  className = "",
  description,
  icon,
  title,
  variant,
}: ContentStateProps) {
  const role =
    variant === "error"
      ? "alert"
      : variant === "loading"
        ? "status"
        : undefined;

  return (
    <div
      className={`rounded-2xl border p-7 text-center sm:p-9 ${surfaces[variant]} ${className}`}
      role={role}
    >
      {variant === "loading" ? (
        <span
          aria-hidden="true"
          className="mx-auto block size-9 animate-spin rounded-full border-3 border-brand-soft border-t-brand-dark"
        />
      ) : icon ? (
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft/45 text-ink">
          <Icon name={icon} />
        </span>
      ) : null}
      <h3
        className={`${variant === "loading" || icon ? "mt-4" : ""} font-bold ${
          variant === "error" ? "text-red-900" : "text-ink"
        }`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`mx-auto mt-1 max-w-2xl text-sm leading-6 ${
            variant === "error" ? "text-red-800" : "text-ink-soft"
          }`}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
