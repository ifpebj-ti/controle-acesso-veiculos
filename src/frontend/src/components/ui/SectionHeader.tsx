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
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
        {eyebrow}
      </p>
      <h2
        className="mt-3 font-display text-2xl leading-tight text-ink"
        id={titleId}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
          {description}
        </p>
      )}
      {meta && <div className="mt-2 text-sm text-ink-soft">{meta}</div>}
    </div>
  );
}
