import type { ComponentProps } from "react";

type CardProps = ComponentProps<"div"> & {
  tone?: "default" | "subtle" | "danger";
};

const surfaces = {
  default: "border-border bg-surface text-text",
  subtle: "border-border bg-surface-subtle text-text",
  danger: "border-danger-border bg-danger-surface text-danger-text",
};

/** A visual surface; consumers provide headings and landmark semantics. */
export function Card({
  className = "",
  tone = "default",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={`min-w-0 break-words rounded-xl border p-5 sm:p-6 ${surfaces[tone]} ${className}`}
    />
  );
}
