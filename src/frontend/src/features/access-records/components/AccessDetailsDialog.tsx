import { useEffect, useRef } from "react";

import { Button } from "../../../components/ui/Button";
import { Icon, type IconName } from "../../../components/ui/Icon";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  exceptionalClosureReasonLabels,
  exceptionalClosureReasons,
} from "../model/exceptionalClosure";
import { formatElapsedTime } from "../model/openAccessTime";
import type { AccessRecord } from "../types";
import { VehicleTypeIndicator } from "./VehicleTypeIndicator";

interface AccessDetailsDialogProps {
  onClose: () => void;
  onCorrect?: () => void;
  record: AccessRecord;
  returnFocusTo: HTMLElement | null;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function isExceptionalClosure(record: AccessRecord) {
  return record.closureType?.toLocaleLowerCase("pt-BR") === "excepcional";
}

function statusPresentation(record: AccessRecord) {
  if (isExceptionalClosure(record)) {
    return { label: "Encerramento excepcional", tone: "warning" as const };
  }
  if (record.exitAtUtc) {
    return { label: "Encerrado", tone: "success" as const };
  }
  return { label: "Em aberto", tone: "warning" as const };
}

function durationLabel(record: AccessRecord) {
  if (isExceptionalClosure(record) && !record.exitAtUtc) {
    return "Tempo total desconhecido";
  }

  const duration = formatElapsedTime(
    record.entryAtUtc,
    record.exitAtUtc ? new Date(record.exitAtUtc) : new Date(),
  );
  return record.exitAtUtc ? duration : `Em andamento há ${duration}`;
}

function exceptionalReason(record: AccessRecord) {
  const reason = record.exceptionalClosureReason;
  if (!reason) return null;
  return exceptionalClosureReasons.includes(
    reason as (typeof exceptionalClosureReasons)[number],
  )
    ? exceptionalClosureReasonLabels[
        reason as (typeof exceptionalClosureReasons)[number]
      ]
    : reason;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1.25rem_minmax(5.5rem,0.7fr)_minmax(0,1fr)] items-start gap-2 border-b border-border py-3 last:border-0">
      <Icon className="mt-0.5 text-ink-soft" name={icon} size={17} />
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="break-words text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

export function AccessDetailsDialog({
  onClose,
  onCorrect,
  record,
  returnFocusTo,
}: AccessDetailsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      returnFocusTo?.focus();
    };
  }, [returnFocusTo]);

  const status = statusPresentation(record);
  const reason = exceptionalReason(record);

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-overlay p-0 sm:items-center sm:p-6">
      <div
        aria-describedby="access-details-description"
        aria-labelledby="access-details-title"
        aria-modal="true"
        className="max-h-[100svh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 shadow-xl sm:mx-auto sm:max-h-[calc(100svh-3rem)] sm:max-w-xl sm:rounded-2xl sm:p-6"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-bold text-ink"
              id="access-details-title"
            >
              Detalhes do registro
            </h2>
            <p
              className="mt-1 text-sm text-ink-soft"
              id="access-details-description"
            >
              Informações completas disponíveis para este acesso.
            </p>
          </div>
          <Button
            aria-label="Fechar detalhes do registro"
            className="size-11 shrink-0 rounded-full p-0"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
            variant="secondary"
          >
            <Icon name="x" size={20} />
          </Button>
        </div>

        <section className="mt-5 rounded-xl border border-border bg-surface-subtle p-4">
          <div className="flex flex-wrap items-center gap-3">
            <VehicleTypeIndicator
              iconSize={26}
              showLabel={false}
              vehicleType={record.vehicleType}
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-lg font-extrabold uppercase tracking-[0.08em] text-ink">
                {record.plate}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {record.vehicleType?.trim() || "Tipo de veículo não informado"}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Categoria: {record.categoryName}
              </p>
            </div>
            <StatusBadge {...status} />
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-border p-4">
          <h3 className="font-bold text-ink">Informações gerais</h3>
          <dl className="mt-2">
            <DetailRow icon="car" label="Placa" value={record.plate} />
            <DetailRow icon="user" label="Condutor" value={record.driverName} />
            <DetailRow
              icon="users"
              label="Categoria"
              value={record.categoryName}
            />
            <DetailRow
              icon="clipboard"
              label="Objetivo"
              value={record.objective}
            />
            <DetailRow icon="clock" label="Situação" value={status.label} />
            {record.eventAuthorizationName?.trim() && (
              <DetailRow
                icon="calendar"
                label="Evento"
                value={record.eventAuthorizationName}
              />
            )}
          </dl>
        </section>

        <section className="mt-4 rounded-xl border border-border p-4">
          <h3 className="font-bold text-ink">Registro de acesso</h3>
          <div className="relative mt-4 space-y-5 pl-9 before:absolute before:bottom-3 before:left-[0.7rem] before:top-3 before:w-px before:bg-border">
            <div className="relative">
              <span className="absolute -left-9 top-0.5 grid size-6 place-items-center rounded-full bg-primary text-primary-text">
                <Icon name="clock" size={14} />
              </span>
              <p className="text-sm font-bold text-success-text">
                Entrada registrada
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {dateFormatter.format(new Date(record.entryAtUtc))}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Registrado pelo usuário #{record.createdById}.
              </p>
            </div>
            <div className="relative">
              <span className="absolute -left-[2.05rem] top-1 size-3 rounded-full border-2 border-border-strong bg-surface" />
              <p className="text-sm font-bold text-ink">
                {record.exitAtUtc
                  ? isExceptionalClosure(record)
                    ? "Saída regularizada"
                    : "Saída registrada"
                  : isExceptionalClosure(record)
                    ? "Saída sem horário conhecido"
                    : "Saída ainda não registrada"}
              </p>
              {record.exitAtUtc && (
                <p className="mt-1 text-sm text-ink">
                  {dateFormatter.format(new Date(record.exitAtUtc))}
                </p>
              )}
              <p className="mt-1 text-xs text-ink-soft">
                {durationLabel(record)}
              </p>
            </div>
          </div>
        </section>

        {isExceptionalClosure(record) && (
          <section className="mt-4 rounded-xl border border-warning-border bg-warning-surface p-4 text-sm text-warning-text">
            <h3 className="font-bold">Regularização excepcional</h3>
            {record.regularizedAtUtc && (
              <p className="mt-2">
                Regularizado em:{" "}
                {dateFormatter.format(new Date(record.regularizedAtUtc))}
              </p>
            )}
            {reason && <p className="mt-1">Motivo: {reason}</p>}
            {record.exceptionalClosureObservation?.trim() && (
              <p className="mt-1 break-words">
                Observação: {record.exceptionalClosureObservation}
              </p>
            )}
          </section>
        )}

        <section className="mt-4 rounded-xl border border-border p-4">
          <h3 className="font-bold text-ink">Permanência</h3>
          <div className="mt-3 flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-ink-soft">
              <Icon name="clock" size={17} /> Tempo total
            </span>
            <strong className="text-right text-ink">
              {durationLabel(record)}
            </strong>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-border p-4">
          <h3 className="font-bold text-ink">Observações</h3>
          <p className="mt-3 break-words rounded-lg bg-surface-subtle p-3 text-sm text-ink-soft">
            {record.observation?.trim() ||
              "Nenhuma observação registrada para este acesso."}
          </p>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Fechar
          </Button>
          {onCorrect && (
            <Button onClick={onCorrect} type="button">
              <Icon name="wrench" size={18} /> Corrigir registro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
