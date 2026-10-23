export function VehicleIdentity({
  plate,
  vehicleIdentification,
}: {
  plate: string | null;
  vehicleIdentification: string | null;
}) {
  return (
    <div>
      <p>
        <strong>Placa:</strong> {plate ?? "Não informada"}
      </p>
      <p>
        <strong>Identificação interna:</strong>{" "}
        {vehicleIdentification ?? "Não informada"}
      </p>
    </div>
  );
}
