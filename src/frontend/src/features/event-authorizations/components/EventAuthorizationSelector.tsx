import { Button } from "../../../components/ui/Button";
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
  const remaining = `${rule.remainingQuantity} de ${rule.quantity} disponíveis`;
  return rule.plate
    ? `Placa ${rule.plate} · ${rule.vehicleType} · ${remaining}`
    : `${rule.vehicleType} · Por tipo · ${remaining}`;
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
        className="rounded-xl border border-border bg-surface-subtle p-5"
        role="status"
      >
        Consultando autorizações vigentes…
      </div>
    );
  }

  if (status === "error" || status === "contract-error") {
    return (
      <div
        className="rounded-xl border border-danger-border bg-danger-surface p-4 text-sm text-danger-text"
        role="alert"
      >
        <p>{errorMessage}</p>
        <p className="mt-2">
          Você ainda pode registrar uma entrada comum sem vincular um evento.
        </p>
        <Button
          className="mt-3"
          onClick={onRetry}
          type="button"
          variant="secondary"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div
        className="rounded-xl border border-warning-border bg-warning-surface p-4 text-sm text-warning-text"
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
      <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-5 text-sm text-text-muted">
        <p className="font-bold text-ink">
          Nenhuma autorização vigente disponível
        </p>
        <p className="mt-1">
          Registre a entrada normalmente ou atualize a consulta.
        </p>
        <Button
          className="mt-3"
          onClick={onRetry}
          type="button"
          variant="secondary"
        >
          Atualizar autorizações
        </Button>
      </div>
    );
  }

  return (
    <fieldset
      aria-describedby={selectionDescription}
      aria-invalid={Boolean(selectionError)}
      className="space-y-3"
    >
      <legend className="sr-only">Autorizações vigentes</legend>
      <p className="sr-only" id="event-authorization-guidance">
        Nenhuma autorização é selecionada automaticamente. O sistema confere a
        autorização escolhida no momento do registro.
      </p>
      {selectionError && (
        <p className="text-sm text-danger-text" id="eventAuthorizationId-error">
          {selectionError}
        </p>
      )}

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-focus ${
          selectedId === null
            ? "border-border-strong bg-surface"
            : "border-border bg-surface hover:bg-surface-subtle"
        }`}
      >
        <input
          className="mt-1"
          checked={selectedId === null}
          name="event-authorization"
          onChange={() => onSelect(null)}
          type="radio"
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <strong className="block text-ink">
              Sem autorização de evento
            </strong>
            <span className="rounded-full border border-border bg-surface-subtle px-2.5 py-1 text-xs font-bold text-text-muted">
              Padrão
            </span>
          </span>
          <span className="mt-1 block text-sm text-ink-soft">
            Use para uma entrada comum, sem vínculo com evento.
          </span>
        </span>
      </label>

      {events.map((event) => (
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-focus ${
            selectedId === event.id
              ? "border-border-strong bg-surface"
              : "border-border bg-surface hover:bg-surface-subtle"
          }`}
          key={event.id}
        >
          <input
            className="mt-1"
            checked={selectedId === event.id}
            name="event-authorization"
            onChange={() => onSelect(event)}
            type="radio"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <strong className="block text-ink">{event.name}</strong>
              {selectedId === event.id && (
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-text">
                  Selecionado
                </span>
              )}
            </span>
            <span className="mt-3 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
              <span className="rounded-xl bg-surface-subtle px-3 py-2 sm:col-span-2">
                <strong className="text-ink">Período:</strong>{" "}
                {dateFormatter.format(new Date(event.startsAtUtc))} até{" "}
                {dateFormatter.format(new Date(event.endsAtUtc))}
              </span>
              <span className="rounded-xl bg-surface-subtle px-3 py-2">
                <strong className="text-ink">Área:</strong> {event.area}
              </span>
              <span className="rounded-xl bg-surface-subtle px-3 py-2">
                <strong className="text-ink">Responsável:</strong>{" "}
                {event.responsible}
              </span>
            </span>
            <span className="mt-4 block text-xs font-bold uppercase tracking-[0.1em] text-ink">
              Veículos autorizados
            </span>
            <ul className="mt-2 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
              {event.vehicleRules.map((rule) => (
                <li
                  className="rounded-xl border border-border bg-surface-subtle px-3 py-2"
                  key={rule.id}
                >
                  {ruleDescription(rule)}
                </li>
              ))}
            </ul>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
