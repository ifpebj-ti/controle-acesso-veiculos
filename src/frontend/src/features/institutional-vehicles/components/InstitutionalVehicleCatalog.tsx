import { ContentState } from "../../../components/ui/ContentState";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { MetricCard } from "../../../components/ui/MetricCard";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { getVehiclePresentation } from "../../access-records/model/vehicleTypePresentation";
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
  const vehiclesWithPlate = vehicles.filter((vehicle) => vehicle.plate).length;
  const vehiclesWithIdentification = vehicles.filter(
    (vehicle) => vehicle.identification,
  ).length;
  const vehicleTypes = new Set(
    vehicles.flatMap((vehicle) => {
      const vehicleType = vehicle.vehicleType
        ?.trim()
        .toLocaleLowerCase("pt-BR");
      return vehicleType ? [vehicleType] : [];
    }),
  ).size;

  return (
    <>
      {status === "ready" && (
        <section
          aria-label="Resumo da frota institucional"
          className="institutional-metric-grid mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            description="disponíveis no catálogo"
            icon="car"
            label="Veículos ativos"
            tone="forest"
            value={vehicles.length}
          />
          <MetricCard
            description="categorias informadas"
            icon="dashboard"
            label="Tipos cadastrados"
            tone="leaf"
            value={vehicleTypes}
          />
          <MetricCard
            description="com placa cadastrada"
            icon="vehicle"
            label="Veículos com placa"
            tone="sage"
            value={vehiclesWithPlate}
          />
          <MetricCard
            description="com identificação interna"
            icon="clipboard"
            label="Identificados pelo campus"
            tone="teal"
            value={vehiclesWithIdentification}
          />
        </section>
      )}

      <section
        aria-busy={status === "loading"}
        className="institutional-catalog mt-6 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_12px_35px_var(--ui-shadow)]"
      >
        <div className="institutional-catalog__heading flex flex-col gap-4 border-b border-ink/8 bg-brand-soft/20 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-xl rounded-bl-md bg-surface text-primary shadow-sm"
            >
              <Icon name="car" size={25} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
                Catálogo ativo
              </p>
              <h2 className="mt-1 text-2xl font-bold text-ink">
                Veículos institucionais
              </h2>
              {status === "ready" && (
                <p className="mt-1 text-sm text-ink-soft" aria-live="polite">
                  {vehicles.length} veículo(s) ativo(s)
                </p>
              )}
            </div>
          </div>

          {status === "ready" && vehicles.length > 0 && (
            <div className="institutional-catalog__search w-full max-w-md rounded-xl p-3">
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="fleet-search"
              >
                Buscar na frota
              </label>
              <div className="relative mt-2">
                <Icon
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
                  name="search"
                />
                <input
                  className="min-h-12 w-full rounded-xl border border-border bg-surface pl-12 pr-4 text-text outline-none placeholder:text-text-muted focus:border-primary focus:ring-3 focus:ring-focus"
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
          <ContentState
            className="m-5 sm:m-6"
            title="Carregando frota institucional…"
            variant="loading"
          />
        ) : status === "error" ? null : filteredVehicles.length === 0 ? (
          <ContentState
            className="m-5 sm:m-6"
            description={
              vehicles.length === 0 && canManage
                ? "Cadastre o primeiro veículo institucional para iniciar o catálogo."
                : vehicles.length === 0
                  ? "O setor responsável ainda não disponibilizou veículos ativos."
                  : "Revise o termo informado ou limpe a busca."
            }
            icon="car"
            title={
              vehicles.length === 0
                ? "Nenhum veículo ativo cadastrado"
                : "Nenhum veículo corresponde à busca"
            }
            variant="empty"
          />
        ) : (
          <>
            <div className="institutional-catalog__grid grid gap-4 p-5 sm:p-6 md:grid-cols-2 2xl:grid-cols-3">
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
            <p
              aria-live="polite"
              className="institutional-catalog__footer border-t border-border px-5 py-4 text-sm text-ink-soft sm:px-6"
            >
              Mostrando {filteredVehicles.length} de {vehicles.length}{" "}
              veículo(s)
            </p>
          </>
        )}
      </section>
    </>
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
  const presentation = getVehiclePresentation(vehicle.vehicleType);

  return (
    <article
      className="fleet-vehicle-card flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_22px_rgba(1,36,40,0.04)] sm:p-5"
      data-vehicle-kind={presentation.kind}
    >
      <div className="flex items-center justify-between gap-3">
        <StatusBadge label="Ativo" tone="success" />
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-text-muted">
          Frota institucional
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[6.5rem_1fr]">
        <span
          aria-hidden="true"
          className="fleet-vehicle-card__visual grid min-h-28 place-items-center rounded-2xl text-primary"
        >
          <Icon name={presentation.icon} size={58} strokeWidth={1.5} />
        </span>

        <div className="min-w-0">
          <p className="fleet-vehicle-card__identifier break-words font-mono text-xl font-bold text-ink">
            {primaryLabel}
          </p>
          {vehicle.plate && vehicle.identification && (
            <p className="mt-1 break-words text-sm font-semibold text-brand-dark">
              {vehicle.identification}
            </p>
          )}
          <p className="mt-1 min-h-5 text-sm text-ink-soft">
            {description || "Marca e modelo não informados"}
          </p>
          <dl className="fleet-vehicle-card__details mt-3 grid gap-2 text-xs text-ink-soft">
            <div className="flex items-center gap-2">
              <Icon name={presentation.icon} size={16} />
              <dt className="sr-only">Tipo</dt>
              <dd>{presentation.label}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="car" size={16} />
              <dt className="sr-only">Cor e ano</dt>
              <dd>
                {[vehicle.color, vehicle.year].filter(Boolean).join(" · ") ||
                  "Cor e ano não informados"}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="calendar" size={16} />
              <dt className="sr-only">Cadastrado em</dt>
              <dd>
                Cadastrado em{" "}
                {createdAtFormatter.format(new Date(vehicle.createdAtUtc))}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {canManage ? (
        <div className="fleet-vehicle-card__actions mt-auto grid grid-cols-2 gap-2 pt-5">
          <Button
            className="w-full"
            disabled={pendingAction !== null}
            onClick={() => onEdit(vehicle)}
            type="button"
            variant="secondary"
          >
            <Icon name="wrench" size={17} /> Editar
          </Button>
          <Button
            className="w-full"
            disabled={pendingAction !== null}
            onClick={() => onDeactivate(vehicle)}
            type="button"
            variant="danger"
          >
            <Icon name="x" size={17} />
            {pendingAction === `deactivate-${vehicle.id}`
              ? "Desativando…"
              : "Desativar"}
          </Button>
        </div>
      ) : (
        <p className="mt-auto pt-5 text-xs font-semibold text-brand-dark">
          Consulta para conferência operacional
        </p>
      )}
    </article>
  );
}
