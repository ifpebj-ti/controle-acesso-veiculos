import type { InstitutionalDriver } from "../../institutional-drivers";
import type { InstitutionalVehicle } from "../../institutional-vehicles";
import { Icon } from "../../../components/ui/Icon";
import { SelectField } from "../../../components/ui/SelectField";
import { getVehiclePresentation } from "../../access-records/model/vehicleTypePresentation";
import type {
  InstitutionalUsageHistoryFilters,
  InstitutionalUsageHistoryFilterErrors,
  InstitutionalVehicleUsage,
  InstitutionalVehicleUsagePage,
} from "../types";

const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-3 focus:ring-focus disabled:opacity-60";
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
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
      className="institutional-catalog mt-7 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_12px_35px_var(--ui-shadow)]"
    >
      <div className="usage-history-heading flex items-start gap-3 px-5 pt-5 sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl rounded-bl-md bg-brand-soft/30 text-primary">
          <Icon name="history" size={22} />
        </span>
        <div>
          <h2 className="text-xl font-bold" id="institutional-history-title">
            Histórico de utilizações
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Consulte as saídas e os retornos registrados da frota institucional.
          </p>
        </div>
      </div>

      <form
        className="usage-history-filters mt-5 grid gap-4 border-y border-ink/10 bg-brand-soft/20 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4"
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
          <SelectField
            aria-describedby={
              serverErrors.vehicleId ? "usage-history-vehicle-error" : undefined
            }
            aria-invalid={Boolean(serverErrors.vehicleId)}
            className={fieldClass}
            disabled={disabled || !catalogsReady}
            id="usage-history-vehicle"
            onValueChange={(value) =>
              onChange({
                ...draft,
                vehicleId: value ? Number(value) : undefined,
              })
            }
            options={[
              { label: "Todos", value: "" },
              ...vehicles.map((vehicle) => ({
                label: vehicleLabel(vehicle),
                value: String(vehicle.id),
              })),
            ]}
            value={draft.vehicleId ? String(draft.vehicleId) : ""}
          />
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
          <SelectField
            aria-describedby={
              serverErrors.driverId ? "usage-history-driver-error" : undefined
            }
            aria-invalid={Boolean(serverErrors.driverId)}
            className={fieldClass}
            disabled={disabled || !catalogsReady}
            id="usage-history-driver"
            onValueChange={(value) =>
              onChange({
                ...draft,
                driverId: value ? Number(value) : undefined,
              })
            }
            options={[
              { label: "Todos", value: "" },
              ...drivers.map((driver) => ({
                label: driver.name,
                value: String(driver.personId),
              })),
            ]}
            value={draft.driverId ? String(draft.driverId) : ""}
          />
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
            className="min-h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-bold text-primary-text disabled:bg-disabled-surface disabled:text-disabled-text"
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
          className="text-xs text-ink-soft sm:col-span-2 xl:col-span-4"
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
          {page.items.length === 0 ? (
            <div className="m-5 rounded-2xl border border-dashed border-ink/20 bg-cream/40 p-10 text-center sm:m-6">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft/45">
                <Icon name="history" />
              </span>
              <p className="mt-4 font-bold">Nenhuma utilização encontrada</p>
              <p className="mt-1 text-sm text-ink-soft">
                Revise os filtros e consulte novamente.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 p-5 sm:p-6 2xl:hidden">
                {page.items.map((usage) => {
                  const distance =
                    usage.returnMileage === null
                      ? null
                      : usage.returnMileage - usage.departureMileage;
                  return (
                    <article
                      className="usage-history-card rounded-2xl border border-ink/10 bg-cream/25 p-5"
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
                          <dt className="text-ink-soft">Saída</dt>
                          <dd>
                            {dateTimeFormatter.format(
                              new Date(usage.departureAtUtc),
                            )}{" "}
                            — {usage.departureMileage} km
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ink-soft">Retorno</dt>
                          <dd>
                            {usage.returnAtUtc && usage.returnMileage !== null
                              ? `${dateTimeFormatter.format(new Date(usage.returnAtUtc))} — ${usage.returnMileage} km`
                              : "Ainda não registrado"}
                          </dd>
                        </div>
                        {distance !== null && (
                          <div className="sm:col-span-2">
                            <dt className="text-ink-soft">
                              Distância registrada
                            </dt>
                            <dd className="font-bold">{distance} km</dd>
                          </div>
                        )}
                      </dl>
                    </article>
                  );
                })}
              </div>
              <div className="usage-history-table-shell hidden overflow-x-auto 2xl:block">
                <table className="w-full min-w-[70rem] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Histórico de utilizações da frota institucional
                  </caption>
                  <thead>
                    <tr className="usage-history-table-heading border-y border-border bg-surface-subtle text-[0.68rem] uppercase tracking-[0.08em] text-ink-soft">
                      <th className="px-5 py-3" scope="col">
                        Data e hora
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Veículo
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Motorista
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Itinerário
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Saída
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Retorno
                      </th>
                      <th className="px-5 py-3" scope="col">
                        Situação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((usage) => {
                      const vehicle = vehicles.find(
                        (item) => item.id === usage.vehicleId,
                      );
                      const presentation = getVehiclePresentation(
                        vehicle?.vehicleType,
                      );
                      return (
                        <tr
                          className="usage-history-table-row border-b border-border last:border-0"
                          key={usage.id}
                        >
                          <td className="px-5 py-4 whitespace-nowrap text-ink-soft">
                            {dateTimeFormatter.format(
                              new Date(usage.departureAtUtc),
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft/30 text-primary">
                                <Icon name={presentation.icon} size={19} />
                              </span>
                              <span>
                                <strong className="block font-mono text-ink">
                                  {usageVehicleLabel(usage)}
                                </strong>
                                <small className="text-ink-soft">
                                  {presentation.label}
                                </small>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-ink-soft">
                            {usage.driverName}
                          </td>
                          <td className="max-w-72 px-4 py-4 text-ink-soft">
                            <span className="line-clamp-2">
                              {usage.itinerary}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-ink-soft">
                            {timeFormatter.format(
                              new Date(usage.departureAtUtc),
                            )}
                            <small className="block">
                              {usage.departureMileage} km
                            </small>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-ink-soft">
                            {usage.returnAtUtc &&
                            usage.returnMileage !== null ? (
                              <>
                                {timeFormatter.format(
                                  new Date(usage.returnAtUtc),
                                )}
                                <small className="block">
                                  {usage.returnMileage} km
                                </small>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${usage.status === "EmUso" ? "border-success-border bg-success-surface text-success-text" : "border-primary/25 bg-primary/5 text-primary"}`}
                            >
                              {usage.status === "EmUso"
                                ? "Em uso"
                                : "Concluído"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="institutional-catalog__footer flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
            <p aria-live="polite" className="text-sm text-ink-soft">
              {page.totalCount} utilização(ões) encontrada(s)
            </p>
            <p className="text-xs font-semibold text-ink-soft">
              Página {page.page} de {Math.max(page.totalPages, 1)}
            </p>
          </div>
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
