export function VehicleIdentity({
  plate,
  vehicleIdentification,
}: {
  plate: string | null;
  vehicleIdentification: string | null;
}) {
  return (
    <div className="rounded-xl bg-surface-subtle p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Veículo
      </p>
      <dl className="mt-2 grid gap-2">
        <div>
          <dt className="text-xs text-text-muted">Placa</dt>
          <dd className="mt-0.5 break-words font-bold text-text">
            {plate ?? "Não informada"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Identificação interna</dt>
          <dd className="mt-0.5 break-words font-semibold text-text">
            {vehicleIdentification ?? "Não informada"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
