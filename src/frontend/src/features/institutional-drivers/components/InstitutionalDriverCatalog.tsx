import { Icon } from "../../../components/ui/Icon";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { InstitutionalDriver } from "../types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

interface InstitutionalDriverCatalogProps {
  canManage: boolean;
  drivers: InstitutionalDriver[];
  filteredDrivers: InstitutionalDriver[];
  onDeactivate: (driver: InstitutionalDriver) => void;
  onQueryChange: (query: string) => void;
  pendingAction: string | null;
  query: string;
  status: "loading" | "ready" | "error";
}

export function InstitutionalDriverCatalog({
  canManage,
  drivers,
  filteredDrivers,
  onDeactivate,
  onQueryChange,
  pendingAction,
  query,
  status,
}: InstitutionalDriverCatalogProps) {
  return (
    <section
      aria-busy={status === "loading"}
      className="mt-6 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]"
    >
      <div className="flex flex-col gap-4 border-b border-ink/8 bg-brand-soft/20 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
            Autorizações ativas
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">
            Motoristas institucionais
          </h2>
          {status === "ready" && (
            <p aria-live="polite" className="mt-1 text-sm text-ink/60">
              {drivers.length} motorista(s) autorizado(s)
            </p>
          )}
        </div>
        {status === "ready" && drivers.length > 0 && (
          <div className="w-full max-w-md">
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="driver-search"
            >
              Buscar motorista
            </label>
            <div className="relative mt-2">
              <Icon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50"
                name="search"
              />
              <input
                className="min-h-12 w-full rounded-xl border border-ink/20 bg-white pl-12 pr-4 text-ink outline-none placeholder:text-ink/40 focus:border-brand-dark focus:ring-3 focus:ring-brand/20"
                id="driver-search"
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Nome do motorista"
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
          Carregando motoristas autorizados…
        </div>
      ) : status === "error" ? null : filteredDrivers.length === 0 ? (
        <div className="m-5 rounded-2xl border border-dashed border-ink/20 bg-cream/40 p-10 text-center sm:m-6">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft/45">
            <Icon name="users" />
          </span>
          <p className="mt-4 font-bold text-ink">
            {drivers.length === 0
              ? "Nenhum motorista autorizado"
              : "Nenhum motorista corresponde à busca"}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {drivers.length === 0 && canManage
              ? "Autorize o primeiro motorista institucional para iniciar o catálogo."
              : drivers.length === 0
                ? "O setor responsável ainda não disponibilizou motoristas ativos."
                : "Revise o nome informado ou limpe a busca."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredDrivers.map((driver) => (
            <article
              className="flex min-w-0 flex-col rounded-2xl border border-ink/10 bg-cream/30 p-5"
              key={driver.id}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft/55 text-ink">
                  <Icon name="users" />
                </span>
                <StatusBadge label="Autorizado" tone="success" />
              </div>
              <h3 className="mt-5 break-words text-lg font-bold text-ink">
                {driver.name}
              </h3>
              <dl className="mt-4 border-t border-ink/10 pt-4 text-sm">
                <dt className="text-xs font-bold uppercase tracking-wider text-ink/45">
                  Autorizado em
                </dt>
                <dd className="mt-1 text-ink/75">
                  {dateFormatter.format(new Date(driver.authorizedAtUtc))}
                </dd>
              </dl>
              {canManage ? (
                <button
                  className="mt-5 min-h-11 rounded-xl border border-red-300 px-4 text-sm font-bold text-red-800 hover:bg-red-50 focus:outline-none focus-visible:ring-3 focus-visible:ring-red-200 disabled:cursor-wait disabled:opacity-60"
                  disabled={pendingAction !== null}
                  onClick={() => onDeactivate(driver)}
                  type="button"
                >
                  {pendingAction === `deactivate-${driver.id}`
                    ? "Desativando…"
                    : "Desativar autorização"}
                </button>
              ) : (
                <p className="mt-auto pt-5 text-xs font-semibold text-brand-dark">
                  Consulta para conferência operacional
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
