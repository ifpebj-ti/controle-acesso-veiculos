import {
  formatReportActor,
  formatReportDateTime,
} from "../model/reportPresentation";
import type { InstitutionalFleetReportItem } from "../types";
import { VehicleIdentity } from "./VehicleIdentity";

export function FleetReportResults({
  items,
  timeZone,
}: {
  items: InstitutionalFleetReportItem[];
  timeZone: string;
}) {
  return items.map((item) => (
    <li
      className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
      key={item.id}
    >
      <div className="grid min-w-0 gap-4 text-sm leading-6 sm:grid-cols-2 xl:grid-cols-4">
        <VehicleIdentity
          plate={item.plate}
          vehicleIdentification={item.vehicleIdentification}
        />
        <div>
          <p>
            <strong>Condutor:</strong> {item.driverName}
          </p>
          <p>
            <strong>Itinerário:</strong> {item.itinerary}
          </p>
        </div>
        <div>
          <p>
            <strong>Saída:</strong>{" "}
            {formatReportDateTime(item.departureAtUtc, timeZone)}
          </p>
          <p>
            <strong>Retorno:</strong>{" "}
            {formatReportDateTime(item.returnAtUtc, timeZone)}
          </p>
          <p>
            <strong>Quilometragem:</strong> {item.departureMileage} km →{" "}
            {item.returnMileage === null
              ? "Não registrada"
              : `${item.returnMileage} km`}
          </p>
        </div>
        <div>
          <p>
            <strong>Situação:</strong> {item.status}
          </p>
          <p>
            <strong>Distância:</strong>{" "}
            {item.distance === null ? "Não calculada" : `${item.distance} km`}
          </p>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-3 text-sm text-text-muted">
        <p>
          <strong>Saída registrada por:</strong>{" "}
          {formatReportActor(item.departureRecordedBy)}
        </p>
        <p>
          <strong>Retorno registrado por:</strong>{" "}
          {formatReportActor(item.returnRecordedBy)}
        </p>
      </div>
    </li>
  ));
}
