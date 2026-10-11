interface BrandProps {
  compact?: boolean;
  className?: string;
  decorative?: boolean;
  size?: "default" | "small";
}

export function Brand({
  compact = false,
  className = "",
  decorative = false,
  size = "default",
}: BrandProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        alt={
          decorative
            ? ""
            : "Instituto Federal de Pernambuco, Campus Belo Jardim"
        }
        className={
          compact
            ? "h-28 w-auto"
            : `${size === "small" ? "h-8" : "h-12"} w-auto max-w-full`
        }
        src={
          compact ? "/brand/ifpe-vertical.png" : "/brand/ifpe-horizontal.png"
        }
      />
    </div>
  );
}
