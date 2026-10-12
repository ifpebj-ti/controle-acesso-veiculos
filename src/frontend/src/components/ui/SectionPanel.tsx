import type { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";

interface SectionPanelProps {
  action?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  icon: IconName;
  title: string;
}

export function SectionPanel({
  action,
  badge,
  children,
  className = "",
  description,
  icon,
  title,
}: SectionPanelProps) {
  return (
    <article className={`institutional-panel ${className}`}>
      <header className="institutional-panel__header">
        <span className="institutional-panel__icon" aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="font-bold leading-tight text-text">{title}</h3>
            {badge}
          </div>
          {description && (
            <p className="mt-1 text-xs leading-5 text-text-muted">
              {description}
            </p>
          )}
        </div>
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </header>
      <div className="institutional-panel__body">{children}</div>
    </article>
  );
}
