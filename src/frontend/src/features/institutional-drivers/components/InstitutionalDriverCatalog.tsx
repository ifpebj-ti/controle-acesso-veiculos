import { ContentState } from "../../../components/ui/ContentState";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { MetricCard } from "../../../components/ui/MetricCard";
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
  const now = new Date();
  const currentMonthDrivers = drivers.filter((driver) => {
    const authorizedAt = new Date(driver.authorizedAtUtc);
    return (
      authorizedAt.getFullYear() === now.getFullYear() &&
      authorizedAt.getMonth() === now.getMonth()
    );
  }).length;
  const recentThreshold = new Date(now);
  recentThreshold.setDate(recentThreshold.getDate() - 30);
  const recentDrivers = drivers.filter(
    (driver) => new Date(driver.authorizedAtUtc) >= recentThreshold,
  ).length;
  const latestAuthorization = drivers.reduce<Date | null>((latest, driver) => {
    const authorizedAt = new Date(driver.authorizedAtUtc);
    return !latest || authorizedAt > latest ? authorizedAt : latest;
  }, null);

  return (
    <>
      {status === "ready" && (
        <section
          aria-label="Resumo dos motoristas autorizados"
          className="institutional-metric-grid mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            description="disponíveis para a frota"
            icon="users"
            label="Total autorizado"
            tone="forest"
            value={drivers.length}
          />
          <MetricCard
            description="no mês atual"
            icon="calendar"
            label="Autorizações no mês"
            tone="leaf"
            value={currentMonthDrivers}
          />
          <MetricCard
            description="nos últimos 30 dias"
            icon="history"
            label="Autorizações recentes"
            tone="sage"
            value={recentDrivers}
          />
          <MetricCard
            description="autorização mais recente"
            icon="clock"
            label="Último cadastro"
            tone="teal"
            value={
              latestAuthorization
                ? dateFormatter.format(latestAuthorization)
                : "—"
            }
          />
        </section>
      )}

      <section
        aria-busy={status === "loading"}
        className="institutional-catalog mt-6 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]"
      >
        <div className="institutional-catalog__heading flex flex-col gap-4 border-b border-ink/8 bg-brand-soft/20 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-xl rounded-bl-md bg-surface text-primary shadow-sm"
            >
              <Icon name="users" size={25} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
                Autorizações ativas
              </p>
              <h2 className="mt-1 text-2xl font-bold text-ink">
                Motoristas institucionais
              </h2>
              {status === "ready" && (
                <p aria-live="polite" className="mt-1 text-sm text-ink-soft">
                  {drivers.length} motorista(s) autorizado(s)
                </p>
              )}
            </div>
          </div>
          {status === "ready" && drivers.length > 0 && (
            <div className="institutional-catalog__search w-full max-w-md rounded-xl p-3">
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="driver-search"
              >
                Buscar motorista
              </label>
              <div className="relative mt-2">
                <Icon
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
                  name="search"
                />
                <input
                  className="min-h-12 w-full rounded-xl border border-ink/20 bg-white pl-12 pr-4 text-ink outline-none placeholder:text-ink-soft focus:border-brand-dark focus:ring-3 focus:ring-brand/20"
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
          <ContentState
            className="m-5 sm:m-6"
            title="Carregando motoristas autorizados…"
            variant="loading"
          />
        ) : status === "error" ? null : filteredDrivers.length === 0 ? (
          <ContentState
            className="m-5 sm:m-6"
            description={
              drivers.length === 0 && canManage
                ? "Autorize o primeiro motorista institucional para iniciar o catálogo."
                : drivers.length === 0
                  ? "O setor responsável ainda não disponibilizou motoristas ativos."
                  : "Revise o nome informado ou limpe a busca."
            }
            icon="users"
            title={
              drivers.length === 0
                ? "Nenhum motorista autorizado"
                : "Nenhum motorista corresponde à busca"
            }
            variant="empty"
          />
        ) : (
          <>
            <div className="institutional-catalog__grid grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredDrivers.map((driver) => (
                <InstitutionalDriverCard
                  canManage={canManage}
                  driver={driver}
                  key={driver.id}
                  onDeactivate={onDeactivate}
                  pendingAction={pendingAction}
                />
              ))}
            </div>
            <p
              aria-live="polite"
              className="institutional-catalog__footer border-t border-border px-5 py-4 text-sm text-ink-soft sm:px-6"
            >
              Mostrando {filteredDrivers.length} de {drivers.length}{" "}
              motorista(s)
            </p>
          </>
        )}
      </section>
    </>
  );
}

function InstitutionalDriverCard({
  canManage,
  driver,
  onDeactivate,
  pendingAction,
}: {
  canManage: boolean;
  driver: InstitutionalDriver;
  onDeactivate: (driver: InstitutionalDriver) => void;
  pendingAction: string | null;
}) {
  const initials = driver.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR"))
    .join("");

  return (
    <article className="driver-authorization-card flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0_8px_22px_rgba(1,36,40,0.04)]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="driver-authorization-card__avatar grid size-14 shrink-0 place-items-center rounded-full border border-success-border/40 bg-success-surface text-lg font-extrabold text-primary"
        >
          {initials || <Icon name="user" size={24} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-bold text-ink">
            {driver.name}
          </h3>
          <div className="mt-1.5">
            <StatusBadge label="Autorizado" tone="success" />
          </div>
        </div>
      </div>

      <dl className="driver-authorization-card__meta mt-5 rounded-xl bg-surface-subtle p-4 text-sm">
        <div className="flex items-center gap-3">
          <Icon className="shrink-0 text-primary" name="calendar" size={18} />
          <dt className="font-semibold text-ink-soft">Autorizado em</dt>
          <dd className="ml-auto font-bold tabular-nums text-ink">
            {dateFormatter.format(new Date(driver.authorizedAtUtc))}
          </dd>
        </div>
      </dl>

      {canManage ? (
        <Button
          className="mt-5 w-full"
          disabled={pendingAction !== null}
          onClick={() => onDeactivate(driver)}
          type="button"
          variant="danger"
        >
          <Icon name="x" size={17} />
          {pendingAction === `deactivate-${driver.id}`
            ? "Desativando…"
            : "Desativar autorização"}
        </Button>
      ) : (
        <p className="mt-auto pt-5 text-xs font-semibold text-brand-dark">
          Consulta para conferência operacional
        </p>
      )}
    </article>
  );
}
