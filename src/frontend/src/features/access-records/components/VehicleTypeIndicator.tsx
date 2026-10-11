import { Icon } from "../../../components/ui/Icon";
import { getVehiclePresentation } from "../model/vehicleTypePresentation";

interface VehicleTypeIndicatorProps {
  className?: string;
  iconSize?: number;
  showLabel?: boolean;
  vehicleType?: string | null;
}

export function VehicleTypeIndicator({
  className = "",
  iconSize = 22,
  showLabel = true,
  vehicleType,
}: VehicleTypeIndicatorProps) {
  const vehicle = getVehiclePresentation(vehicleType);

  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <span
        className="open-access-vehicle-icon"
        data-vehicle-kind={vehicle.kind}
      >
        <Icon name={vehicle.icon} size={iconSize} />
      </span>
      {showLabel && (
        <span className="break-words text-xs font-semibold text-ink-soft">
          {vehicle.label}
        </span>
      )}
    </div>
  );
}
