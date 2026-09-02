interface BrandProps {
  compact?: boolean;
  className?: string;
}

export function Brand({ compact = false, className = '' }: BrandProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        alt="Instituto Federal de Pernambuco, Campus Belo Jardim"
        className={compact ? 'h-28 w-auto' : 'h-12 w-auto max-w-full'}
        src={compact ? '/brand/ifpe-vertical.png' : '/brand/ifpe-horizontal.png'}
      />
    </div>
  );
}
