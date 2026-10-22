import {
  formatReportActor,
  formatReportDateTime,
} from "../model/reportPresentation";
import type { VehicleMovementReportItem } from "../types";
import { VehicleIdentity } from "./VehicleIdentity";

export function MovementReportResults({
  items,
  timeZone,
}: {
  items: VehicleMovementReportItem[];
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
            <strong>Categoria:</strong> {item.categoryName}
          </p>
          <p>
            <strong>Tipo de veículo:</strong>{" "}
            {item.vehicleType ?? "Não informado"}
          </p>
        </div>
        <div>
          <p>
            <strong>Entrada:</strong>{" "}
            {formatReportDateTime(item.entryAtUtc, timeZone)}
          </p>
          <p>
            <strong>Saída:</strong>{" "}
            {formatReportDateTime(item.exitAtUtc, timeZone)}
          </p>
        </div>
        <div>
          <p>
            <strong>Situação:</strong> {item.status}
          </p>
          <p>
            <strong>Objetivo:</strong> {item.objective}
          </p>
          {item.eventName && (
            <p>
              <strong>Evento:</strong> {item.eventName}
            </p>
          )}
          {item.closureType && (
            <p>
              <strong>Encerramento:</strong> {item.closureType}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-3 text-sm text-text-muted">
        <p>
          <strong>Entrada registrada por:</strong>{" "}
          {formatReportActor(item.entryRecordedBy)}
        </p>
        <p>
          <strong>Saída registrada por:</strong>{" "}
          {formatReportActor(item.exitRecordedBy)}
        </p>
      </div>
    </li>
  ));
}
