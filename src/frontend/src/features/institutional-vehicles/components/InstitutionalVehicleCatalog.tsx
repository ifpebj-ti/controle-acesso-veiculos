import { Icon } from "../../../components/ui/Icon";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { InstitutionalVehicle } from "../types";

const createdAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

interface InstitutionalVehicleCatalogProps {
  canManage: boolean;
  filteredVehicles: InstitutionalVehicle[];
  onDeactivate: (vehicle: InstitutionalVehicle) => void;
  onEdit: (vehicle: InstitutionalVehicle) => void;
  onQueryChange: (query: string) => void;
  pendingAction: string | null;
  query: string;
  status: "loading" | "ready" | "error";
  vehicles: InstitutionalVehicle[];
}

export function InstitutionalVehicleCatalog({
  canManage,
  filteredVehicles,
  onDeactivate,
  onEdit,
  onQueryChange,
  pendingAction,
  query,
  status,
  vehicles,
}: InstitutionalVehicleCatalogProps) {
  return (
    <section
      aria-busy={status === "loading"}
      className="mt-6 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]"
    >
      <div className="flex flex-col gap-4 border-b border-ink/8 bg-brand-soft/20 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
            Catálogo ativo
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">
            Veículos institucionais
          </h2>
          {status === "ready" && (
            <p className="mt-1 text-sm text-ink/60" aria-live="polite">
              {vehicles.length} veículo(s) ativo(s)
            </p>
          )}
        </div>

        {status === "ready" && vehicles.length > 0 && (
          <div className="w-full max-w-md">
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="fleet-search"
            >
              Buscar na frota
            </label>
            <div className="relative mt-2">
              <Icon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50"
                name="search"
              />
              <input
                className="min-h-12 w-full rounded-xl border border-ink/20 bg-white pl-12 pr-4 text-ink outline-none placeholder:text-ink/40 focus:border-brand-dark focus:ring-3 focus:ring-brand/20"
                id="fleet-search"
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Placa, identificação, modelo ou cor"
                type="search"
                value={query}
              />
            </div>
          </div>
        )}
      </div>

      {status === "loading" ? (
        <div
          className="m-5 rounded-2xl bg-cream/50 p-10 text-center"
          role="status"
        >
          Carregando frota institucional…
        </div>
      ) : status === "error" ? null : filteredVehicles.length === 0 ? (
        <div className="m-5 rounded-2xl border border-dashed border-ink/20 bg-cream/40 p-10 text-center sm:m-6">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft/45">
            <Icon name="car" />
          </span>
          <p className="mt-4 font-bold text-ink">
            {vehicles.length === 0
              ? "Nenhum veículo ativo cadastrado"
              : "Nenhum veículo corresponde à busca"}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {vehicles.length === 0 && canManage
              ? "Cadastre o primeiro veículo institucional para iniciar o catálogo."
              : vehicles.length === 0
                ? "O setor responsável ainda não disponibilizou veículos ativos."
                : "Revise o termo informado ou limpe a busca."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <InstitutionalVehicleCard
              canManage={canManage}
              key={vehicle.id}
              onDeactivate={onDeactivate}
              onEdit={onEdit}
              pendingAction={pendingAction}
              vehicle={vehicle}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface InstitutionalVehicleCardProps {
  canManage: boolean;
  onDeactivate: (vehicle: InstitutionalVehicle) => void;
  onEdit: (vehicle: InstitutionalVehicle) => void;
  pendingAction: string | null;
  vehicle: InstitutionalVehicle;
}

function InstitutionalVehicleCard({
  canManage,
  onDeactivate,
  onEdit,
  pendingAction,
  vehicle,
}: InstitutionalVehicleCardProps) {
  const primaryLabel =
    vehicle.plate ?? vehicle.identification ?? "Sem identificação";
  const description = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-ink/10 bg-cream/30 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft/55 text-ink">
          <Icon name="car" />
        </span>
        <StatusBadge label="Ativo" tone="success" />
      </div>
      <p className="mt-5 break-words font-mono text-xl font-bold text-ink">
        {primaryLabel}
      </p>
      {vehicle.plate && vehicle.identification && (
        <p className="mt-1 break-words text-sm font-semibold text-brand-dark">
          {vehicle.identification}
        </p>
      )}
      <p className="mt-3 min-h-6 text-sm text-ink/70">
        {description || vehicle.vehicleType || "Detalhes não informados"}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4 text-sm">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-ink/45">
            Tipo
          </dt>
          <dd className="mt-1 text-ink/75">
            {vehicle.vehicleType ?? "Não informado"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-ink/45">
            Cor / ano
          </dt>
          <dd className="mt-1 text-ink/75">
            {[vehicle.color, vehicle.year].filter(Boolean).join(" · ") ||
              "Não informado"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wider text-ink/45">
            Cadastrado em
          </dt>
          <dd className="mt-1 text-ink/75">
            {createdAtFormatter.format(new Date(vehicle.createdAtUtc))}
          </dd>
        </div>
      </dl>

      {canManage ? (
        <div className="mt-auto flex gap-2 pt-5">
          <button
            className="min-h-11 flex-1 rounded-xl border border-ink/20 px-4 text-sm font-bold text-ink hover:bg-white focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
            disabled={pendingAction !== null}
            onClick={() => onEdit(vehicle)}
            type="button"
          >
            Editar
          </button>
          <button
            className="min-h-11 flex-1 rounded-xl border border-red-300 px-4 text-sm font-bold text-red-800 hover:bg-red-50 focus:outline-none focus-visible:ring-3 focus-visible:ring-red-200 disabled:opacity-60"
            disabled={pendingAction !== null}
            onClick={() => onDeactivate(vehicle)}
            type="button"
          >
            {pendingAction === `deactivate-${vehicle.id}`
              ? "Desativando…"
              : "Desativar"}
          </button>
        </div>
      ) : (
        <p className="mt-auto pt-5 text-xs font-semibold text-brand-dark">
          Consulta para conferência operacional
        </p>
      )}
    </article>
  );
}
