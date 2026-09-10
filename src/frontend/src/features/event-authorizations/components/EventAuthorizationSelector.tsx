import type { EventAuthorization } from "../types";
import type { CurrentEventAuthorizationsStatus } from "../hooks/useCurrentEventAuthorizations";

interface EventAuthorizationSelectorProps {
  errorMessage: string | null;
  events: EventAuthorization[];
  onRetry: () => void;
  onSelect: (event: EventAuthorization | null) => void;
  selectedId: number | null;
  selectionError?: string;
  status: CurrentEventAuthorizationsStatus;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function ruleDescription(rule: EventAuthorization["vehicleRules"][number]) {
  const remaining = `${rule.remainingQuantity} de ${rule.quantity} restante(s)`;
  return rule.plate
    ? `Placa ${rule.plate} · ${rule.vehicleType} · ${remaining}`
    : `${rule.vehicleType} · cota por tipo · ${remaining}`;
}

export function EventAuthorizationSelector({
  errorMessage,
  events,
  onRetry,
  onSelect,
  selectedId,
  selectionError,
  status,
}: EventAuthorizationSelectorProps) {
  const selectionDescription = [
    "event-authorization-guidance",
    selectionError ? "eventAuthorizationId-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (status === "loading" || status === "idle") {
    return (
      <div
        aria-busy="true"
        className="rounded-2xl bg-cream/45 p-5"
        role="status"
      >
        Consultando autorizações vigentes…
      </div>
    );
  }

  if (status === "error" || status === "contract-error") {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        role="alert"
      >
        <p>{errorMessage}</p>
        <p className="mt-2">
          Você ainda pode registrar uma entrada comum sem vincular um evento.
        </p>
        <button
          className="mt-3 min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-800/30"
          onClick={onRetry}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div
        className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        role="alert"
      >
        <p>{errorMessage}</p>
        <p className="mt-2">
          A entrada comum continua disponível sem associação de evento.
        </p>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 bg-cream/35 p-5 text-sm text-ink/70">
        <p className="font-bold text-ink">
          Nenhuma autorização vigente disponível
        </p>
        <p className="mt-1">
          Registre a entrada normalmente ou atualize a consulta.
        </p>
        <button
          className="mt-3 min-h-10 rounded-xl border border-ink/20 px-4 font-bold text-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
          onClick={onRetry}
          type="button"
        >
          Atualizar autorizações
        </button>
      </div>
    );
  }

  return (
    <fieldset
      aria-describedby={selectionDescription}
      aria-invalid={Boolean(selectionError)}
      className="space-y-3"
    >
      <legend className="font-display text-xl text-ink">
        Autorizações vigentes
      </legend>
      <p
        className="text-sm leading-6 text-ink/65"
        id="event-authorization-guidance"
      >
        A autorização será conferida pelo sistema no momento do registro.
      </p>
      {selectionError && (
        <p className="text-sm text-red-800" id="eventAuthorizationId-error">
          {selectionError}
        </p>
      )}

      <label className="flex cursor-pointer gap-3 rounded-2xl border border-ink/12 bg-white p-4 focus-within:ring-3 focus-within:ring-brand/25">
        <input
          checked={selectedId === null}
          name="event-authorization"
          onChange={() => onSelect(null)}
          type="radio"
        />
        <span>
          <strong className="block text-ink">Sem autorização de evento</strong>
          <span className="mt-1 block text-sm text-ink/60">
            Manter esta entrada no fluxo geral, sem associação.
          </span>
        </span>
      </label>

      {events.map((event) => (
        <label
          className="flex cursor-pointer gap-3 rounded-2xl border border-ink/12 bg-white p-4 focus-within:border-brand-dark focus-within:ring-3 focus-within:ring-brand/25"
          key={event.id}
        >
          <input
            checked={selectedId === event.id}
            name="event-authorization"
            onChange={() => onSelect(event)}
            type="radio"
          />
          <span className="min-w-0 flex-1">
            <strong className="block text-ink">{event.name}</strong>
            <span className="mt-1 block text-sm text-ink/65">
              {dateFormatter.format(new Date(event.startsAtUtc))} até{" "}
              {dateFormatter.format(new Date(event.endsAtUtc))}
            </span>
            <span className="mt-1 block text-sm text-ink/65">
              Área: {event.area} · Responsável: {event.responsible}
            </span>
            <span className="mt-3 block text-xs font-bold uppercase tracking-[0.1em] text-ink/50">
              Regras de veículos
            </span>
            <ul className="mt-1 space-y-1 text-sm text-ink/70">
              {event.vehicleRules.map((rule) => (
                <li key={rule.id}>{ruleDescription(rule)}</li>
              ))}
            </ul>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
