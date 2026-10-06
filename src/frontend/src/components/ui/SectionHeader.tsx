import type { ReactNode } from "react";

interface SectionHeaderProps {
  className?: string;
  description?: string;
  eyebrow: string;
  meta?: ReactNode;
  title: string;
  titleId?: string;
}

export function SectionHeader({
  className = "",
  description,
  eyebrow,
  meta,
  title,
  titleId,
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-text-muted">{eyebrow}</p>
      <h2
        className="mt-3 break-words text-xl font-semibold leading-tight text-text"
        id={titleId}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">
          {description}
        </p>
      )}
      {meta && <div className="mt-2 text-sm text-text-muted">{meta}</div>}
    </div>
  );
}
