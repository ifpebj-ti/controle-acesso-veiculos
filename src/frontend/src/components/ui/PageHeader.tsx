import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1 break-words">
        {eyebrow && (
          <p className="text-sm font-semibold text-text-muted">{eyebrow}</p>
        )}
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-text sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-base leading-6 text-text-muted">
          {description}
        </p>
      </div>
      {action && (
        <div className="flex max-w-full flex-wrap gap-3">{action}</div>
      )}
    </header>
  );
}
