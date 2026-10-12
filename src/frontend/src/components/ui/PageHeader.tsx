import type { ReactNode } from "react";

import { InstitutionalAccent } from "./InstitutionalAccent";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: "default" | "prominent";
}

export function PageHeader({
  action,
  description,
  eyebrow,
  title,
  variant = "default",
}: PageHeaderProps) {
  const isProminent = variant === "prominent";

  return (
    <header
      className={`flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between ${
        isProminent ? "institutional-page-hero" : ""
      }`}
    >
      {isProminent && (
        <InstitutionalAccent className="institutional-page-hero__accent" />
      )}
      <div className="relative z-1 min-w-0 flex-1 break-words">
        {eyebrow && (
          <p
            className={
              isProminent
                ? "text-xs font-bold uppercase tracking-[0.14em] text-primary"
                : "text-sm font-semibold text-text-muted"
            }
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={
            isProminent
              ? "mt-2 text-3xl font-semibold leading-tight text-text sm:text-4xl"
              : "mt-3 text-2xl font-semibold leading-tight text-text sm:text-3xl"
          }
        >
          {title}
        </h1>
        <p
          className={`${isProminent ? "max-w-5xl" : "max-w-3xl"} mt-2 text-base leading-6 text-text-muted`}
        >
          {description}
        </p>
      </div>
      {action && (
        <div className="relative z-1 flex max-w-full flex-wrap gap-3">
          {action}
        </div>
      )}
    </header>
  );
}
