import type { InstitutionalDriver } from "../../institutional-drivers";
import type { InstitutionalVehicle } from "../../institutional-vehicles";
import { Icon } from "../../../components/ui/Icon";
import type {
  InstitutionalUsageHistoryFilters,
  InstitutionalUsageHistoryFilterErrors,
  InstitutionalVehicleUsage,
  InstitutionalVehicleUsagePage,
} from "../types";

const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-ink/20 bg-white px-3 text-sm text-ink outline-none focus:border-brand-dark focus:ring-3 focus:ring-brand/20 disabled:opacity-60";
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function vehicleLabel(vehicle: InstitutionalVehicle) {
  return vehicle.plate ?? vehicle.identification ?? `Veículo ${vehicle.id}`;
}

function usageVehicleLabel(usage: InstitutionalVehicleUsage) {
  return (
    usage.plate ?? usage.vehicleIdentification ?? `Veículo ${usage.vehicleId}`
  );
}

interface InstitutionalUsageHistoryProps {
  catalogsReady: boolean;
  draft: InstitutionalUsageHistoryFilters;
  drivers: InstitutionalDriver[];
  errorMessage: string | null;
  onApply: () => void;
  onChange: (next: InstitutionalUsageHistoryFilters) => void;
  onClear: () => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  page: InstitutionalVehicleUsagePage | null;
  periodError: string | null;
  serverErrors: InstitutionalUsageHistoryFilterErrors;
  status: "idle" | "loading" | "ready" | "error" | "denied";
  vehicles: InstitutionalVehicle[];
}

export function InstitutionalUsageHistory({
  catalogsReady,
  draft,
  drivers,
  errorMessage,
  onApply,
  onChange,
  onClear,
  onPageChange,
  onRetry,
  page,
  periodError,
  serverErrors,
  status,
  vehicles,
}: InstitutionalUsageHistoryProps) {
  const disabled = status === "loading";
  const periodMessage = periodError ?? serverErrors.period;
  const periodDescription = periodMessage
    ? "usage-history-period-hint usage-history-period-error"
    : "usage-history-period-hint";

  return (
    <section
      aria-busy={status === "loading"}
      aria-labelledby="institutional-history-title"
      className="mt-7 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]"
    >
      <div className="px-5 pt-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Supervisão da frota
        </p>
        <h2
          className="mt-1 font-display text-2xl"
          id="institutional-history-title"
        >
          Histórico institucional
        </h2>
      </div>

      <form
        className="mt-5 grid gap-4 border-y border-ink/10 bg-brand-soft/20 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <div>
          <label className="text-sm font-semibold" htmlFor="usage-history-from">
            Início do período
          </label>
          <input
            aria-describedby={periodDescription}
            aria-invalid={Boolean(periodMessage)}
            className={fieldClass}
            disabled={disabled}
            id="usage-history-from"
            onChange={(event) =>
              onChange({ ...draft, fromUtc: event.target.value })
            }
            type="datetime-local"
            value={draft.fromUtc}
          />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="usage-history-to">
            Fim do período
          </label>
          <input
            aria-describedby={periodDescription}
            aria-invalid={Boolean(periodMessage)}
            className={fieldClass}
            disabled={disabled}
            id="usage-history-to"
            onChange={(event) =>
              onChange({ ...draft, toUtc: event.target.value })
            }
            type="datetime-local"
            value={draft.toUtc}
          />
        </div>
        <div>
          <label
            className="text-sm font-semibold"
            htmlFor="usage-history-plate"
          >
            Placa
          </label>
          <input
            aria-describedby={
              serverErrors.plate ? "usage-history-plate-error" : undefined
            }
            aria-invalid={Boolean(serverErrors.plate)}
            className={fieldClass}
            disabled={disabled}
            id="usage-history-plate"
            maxLength={10}
            onChange={(event) =>
              onChange({ ...draft, plate: event.target.value })
            }
            placeholder="Ex.: TST1A23"
            value={draft.plate}
          />
          {serverErrors.plate && (
            <p
              className="mt-1.5 text-sm text-red-800"
              id="usage-history-plate-error"
              role="alert"
            >
              {serverErrors.plate}
            </p>
          )}
        </div>
        <div>
          <label
            className="text-sm font-semibold"
            htmlFor="usage-history-identification"
          >
            Identificação da frota
          </label>
          <input
            aria-describedby={
              serverErrors.vehicleIdentification
                ? "usage-history-identification-error"
                : undefined
            }
            aria-invalid={Boolean(serverErrors.vehicleIdentification)}
            className={fieldClass}
            disabled={disabled}
            id="usage-history-identification"
            maxLength={100}
            onChange={(event) =>
              onChange({
                ...draft,
                vehicleIdentification: event.target.value,
              })
            }
            placeholder="Ex.: FROTA-TESTE-01"
            value={draft.vehicleIdentification}
          />
          {serverErrors.vehicleIdentification && (
            <p
              className="mt-1.5 text-sm text-red-800"
              id="usage-history-identification-error"
              role="alert"
            >
              {serverErrors.vehicleIdentification}
            </p>
          )}
        </div>
        <div>
          <label
            className="text-sm font-semibold"
            htmlFor="usage-history-vehicle"
          >
            Veículo ativo
          </label>
          <select
            aria-describedby={
              serverErrors.vehicleId ? "usage-history-vehicle-error" : undefined
            }
            aria-invalid={Boolean(serverErrors.vehicleId)}
            className={fieldClass}
            disabled={disabled || !catalogsReady}
            id="usage-history-vehicle"
            onChange={(event) =>
              onChange({
                ...draft,
                vehicleId: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            value={draft.vehicleId ?? ""}
          >
            <option value="">Todos</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicleLabel(vehicle)}
              </option>
            ))}
          </select>
          {serverErrors.vehicleId && (
            <p
              className="mt-1.5 text-sm text-red-800"
              id="usage-history-vehicle-error"
              role="alert"
            >
              {serverErrors.vehicleId}
            </p>
          )}
        </div>
        <div>
          <label
            className="text-sm font-semibold"
            htmlFor="usage-history-driver"
          >
            Motorista ativo
          </label>
          <select
            aria-describedby={
              serverErrors.driverId ? "usage-history-driver-error" : undefined
            }
            aria-invalid={Boolean(serverErrors.driverId)}
            className={fieldClass}
            disabled={disabled || !catalogsReady}
            id="usage-history-driver"
            onChange={(event) =>
              onChange({
                ...draft,
                driverId: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            value={draft.driverId ?? ""}
          >
            <option value="">Todos</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.personId}>
                {driver.name}
              </option>
            ))}
          </select>
          {serverErrors.driverId && (
            <p
              className="mt-1.5 text-sm text-red-800"
              id="usage-history-driver-error"
              role="alert"
            >
              {serverErrors.driverId}
            </p>
          )}
        </div>
        <div className="flex items-end gap-2 sm:col-span-2">
          <button
            className="min-h-11 flex-1 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-60"
            disabled={disabled}
            type="submit"
          >
            Aplicar filtros
          </button>
          <button
            className="min-h-11 rounded-xl border border-ink/20 px-4 text-sm font-bold disabled:opacity-60"
            disabled={disabled}
            onClick={onClear}
            type="button"
          >
            Limpar
          </button>
        </div>
        <p
          className="text-xs text-ink/60 sm:col-span-2 xl:col-span-4"
          id="usage-history-period-hint"
        >
          Informe data e hora locais em um intervalo máximo de 366 dias.
        </p>
        {periodMessage && (
          <p
            className="text-sm font-semibold text-red-800 sm:col-span-2 xl:col-span-4"
            id="usage-history-period-error"
            role="alert"
          >
            {periodMessage}
          </p>
        )}
      </form>

      {status === "error" && errorMessage ? (
        <div
          className="m-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 sm:m-6"
          role="alert"
        >
          <p>{errorMessage}</p>
          <button
            className="mt-4 min-h-10 rounded-xl border border-red-300 px-4 font-bold"
            onClick={onRetry}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : status === "loading" ? (
        <div className="p-10 text-center" role="status">
          Carregando histórico institucional…
        </div>
      ) : status === "ready" && page ? (
        <>
          <p
            aria-live="polite"
            className="px-5 pt-5 text-sm text-ink/60 sm:px-6"
          >
            {page.totalCount} utilização(ões) encontrada(s)
          </p>
          {page.items.length === 0 ? (
            <div className="m-5 rounded-2xl border border-dashed border-ink/20 bg-cream/40 p-10 text-center sm:m-6">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft/45">
                <Icon name="history" />
              </span>
              <p className="mt-4 font-bold">Nenhuma utilização encontrada</p>
              <p className="mt-1 text-sm text-ink/60">
                Revise os filtros e consulte novamente.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
              {page.items.map((usage) => {
                const distance =
                  usage.returnMileage === null
                    ? null
                    : usage.returnMileage - usage.departureMileage;
                return (
                  <article
                    className="rounded-2xl border border-ink/10 bg-cream/25 p-5"
                    key={usage.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                          {usageVehicleLabel(usage)}
                        </p>
                        <h3 className="mt-1 text-lg font-bold">
                          {usage.driverName}
                        </h3>
                      </div>
                      <span className="rounded-full bg-brand-soft/55 px-3 py-1 text-xs font-bold">
                        {usage.status === "EmUso" ? "Em uso" : "Concluído"}
                      </span>
                    </div>
                    <p className="mt-4 break-words text-sm font-semibold">
                      {usage.itinerary}
                    </p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-ink/55">Saída</dt>
                        <dd>
                          {dateTimeFormatter.format(
                            new Date(usage.departureAtUtc),
                          )}{" "}
                          — {usage.departureMileage} km
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink/55">Retorno</dt>
                        <dd>
                          {usage.returnAtUtc && usage.returnMileage !== null
                            ? `${dateTimeFormatter.format(new Date(usage.returnAtUtc))} — ${usage.returnMileage} km`
                            : "Ainda não registrado"}
                        </dd>
                      </div>
                      {distance !== null && (
                        <div className="sm:col-span-2">
                          <dt className="text-ink/55">Distância registrada</dt>
                          <dd className="font-bold">{distance} km</dd>
                        </div>
                      )}
                    </dl>
                  </article>
                );
              })}
            </div>
          )}
          {page.totalPages > 1 && (
            <nav
              aria-label="Paginação do histórico institucional"
              className="flex items-center justify-between border-t border-ink/10 px-5 py-4 sm:px-6"
            >
              <button
                className="min-h-10 rounded-xl border border-ink/20 px-4 text-sm font-bold disabled:opacity-40"
                disabled={page.page <= 1}
                onClick={() => onPageChange(page.page - 1)}
                type="button"
              >
                Anterior
              </button>
              <span className="text-sm font-semibold">
                Página {page.page} de {page.totalPages}
              </span>
              <button
                className="min-h-10 rounded-xl border border-ink/20 px-4 text-sm font-bold disabled:opacity-40"
                disabled={page.page >= page.totalPages}
                onClick={() => onPageChange(page.page + 1)}
                type="button"
              >
                Próxima
              </button>
            </nav>
          )}
        </>
      ) : null}
    </section>
  );
}
