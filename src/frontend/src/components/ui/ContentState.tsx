import type { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";
import { Card } from "./Card";

type ContentStateVariant = "empty" | "error" | "loading";

interface ContentStateProps {
  action?: ReactNode;
  className?: string;
  description?: string;
  icon?: IconName;
  title: string;
  variant: ContentStateVariant;
}

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
    <Card
      className={`text-center ${variant === "empty" ? "border-dashed" : ""} ${className}`}
      role={role}
      tone={
        variant === "error"
          ? "danger"
          : variant === "loading"
            ? "subtle"
            : "default"
      }
    >
      {variant === "loading" ? (
        <span
          aria-hidden="true"
          className="mx-auto block size-8 animate-spin rounded-full border-3 border-border border-t-text motion-reduce:animate-none"
        />
      ) : icon ? (
        <span className="mx-auto grid size-11 place-items-center rounded-xl text-current">
          <Icon name={icon} />
        </span>
      ) : null}
      <h3
        className={`${variant === "loading" || icon ? "mt-4" : ""} font-bold ${
          variant === "error" ? "text-danger-text" : "text-text"
        }`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`mx-auto mt-1 max-w-2xl text-sm leading-6 ${
            variant === "error" ? "text-danger-text" : "text-text-muted"
          }`}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">{action}</div>
      )}
    </Card>
  );
}
