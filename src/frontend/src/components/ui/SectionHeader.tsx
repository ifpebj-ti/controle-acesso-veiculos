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
    <div className={`section-header ${className}`}>
      <p className="section-header__eyebrow text-sm font-semibold">{eyebrow}</p>
      <h2
        className="section-header__title mt-3 break-words text-xl font-semibold leading-tight"
        id={titleId}
      >
        {title}
      </h2>
      {description && (
        <p className="section-header__description mt-2 max-w-3xl text-sm leading-6">
          {description}
        </p>
      )}
      {meta && (
        <div className="section-header__description mt-2 text-sm">{meta}</div>
      )}
    </div>
  );
}
