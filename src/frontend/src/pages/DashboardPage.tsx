import { useEffect, useMemo, useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { ContentState } from "../components/ui/ContentState";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import {
  profileLabels,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  DailySummaryPanel,
  SummaryDateFilter,
  useOperationalSummary,
} from "../features/operational-summary";

const summaryDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
});

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatSummaryDate(localDate: string) {
  return summaryDateFormatter.format(new Date(`${localDate}T12:00:00`));
}

function institutionalDateTime(date: Date, timeZoneId?: string) {
  const timeZone = timeZoneId ? { timeZone: timeZoneId } : {};
  const dateParts = new Intl.DateTimeFormat("pt-BR", {
    ...timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((parts, part) => {
      if (part.type !== "literal") parts[part.type] = part.value;
      return parts;
    }, {});
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      ...timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );

  return {
    clock: new Intl.DateTimeFormat("pt-BR", {
      ...timeZone,
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      second: "2-digit",
    }).format(date),
    fullDate: new Intl.DateTimeFormat("pt-BR", {
      ...timeZone,
      day: "numeric",
      month: "long",
      weekday: "long",
      year: "numeric",
    }).format(date),
    hour,
    localDate: `${dateParts.year}-${dateParts.month}-${dateParts.day}`,
  };
}

export function DashboardPage() {
  const { user } = useAuthenticatedSession();
  const operationalSummary = useOperationalSummary();
  const [now, setNow] = useState(() => new Date());
  const currentInstitutionalTime = useMemo(
    () => institutionalDateTime(now, operationalSummary.summary?.timeZoneId),
    [now, operationalSummary.summary?.timeZoneId],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (operationalSummary.status === "denied") {
    return (
      <AccessDeniedState
        message={operationalSummary.errorMessage ?? undefined}
      />
    );
  }

  const isCurrentDate =
    operationalSummary.summary?.localDate ===
    currentInstitutionalTime.localDate;

  return (
    <div className="min-w-0">
      <header className="sticky top-16 z-10 -mx-4 flex flex-col gap-5 border-b border-border bg-background px-4 pb-5 pt-1 sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-9 lg:flex-row lg:items-end lg:justify-between lg:px-9 lg:pt-0">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-dark">
            Controle de acesso • Campus Belo Jardim
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-text sm:text-4xl">
            {greetingForHour(currentInstitutionalTime.hour)},{" "}
            {profileLabels[user.profileName]}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
            Acompanhe as movimentações e a situação dos acessos do dia.
          </p>
        </div>

        <div className="shrink-0 border-l-4 border-primary pl-4 text-left lg:min-w-72 lg:text-right">
          <p className="text-sm font-semibold text-ink-soft">
            {capitalize(currentInstitutionalTime.fullDate)}
          </p>
          <time
            className="mt-1 block font-mono text-3xl font-semibold tracking-[0.08em] text-ink"
            dateTime={now.toISOString()}
          >
            {currentInstitutionalTime.clock}
          </time>
        </div>
      </header>

      <Card
        aria-labelledby="daily-summary-title"
        className="mt-6 sm:p-7"
        role="region"
      >
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-dark">
              Movimentações do dia
            </p>
            <h2
              className="mt-2 text-2xl font-bold text-text"
              id="daily-summary-title"
            >
              Resumo do dia
            </h2>
            {operationalSummary.summary && (
              <p className="mt-2 text-sm text-ink-soft">
                {capitalize(
                  formatSummaryDate(operationalSummary.summary.localDate),
                )}
              </p>
            )}
          </div>
          <SummaryDateFilter
            date={operationalSummary.draftDate}
            disabled={operationalSummary.status === "loading"}
            error={operationalSummary.dateError}
            onApply={operationalSummary.applyDate}
            onChange={operationalSummary.setDraftDate}
          />
        </div>

        {operationalSummary.status === "loading" && (
          <ContentState
            className="mt-6"
            title="Carregando resumo operacional…"
            variant="loading"
          />
        )}

        {operationalSummary.status === "error" && (
          <ContentState
            action={
              <Button
                variant="secondary"
                onClick={operationalSummary.retry}
                type="button"
              >
                Tentar novamente
              </Button>
            }
            className="mt-6"
            description={operationalSummary.errorMessage ?? undefined}
            title="Resumo indisponível"
            variant="error"
          />
        )}

        {operationalSummary.status === "ready" &&
          operationalSummary.summary && (
            <DailySummaryPanel summary={operationalSummary.summary} />
          )}
      </Card>

      <details className="group mt-5 overflow-hidden rounded-xl border border-border bg-surface text-sm leading-6">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 font-bold text-text hover:bg-surface-subtle focus:outline-3 focus:outline-offset-[-3px] focus:outline-focus [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-subtle text-lg font-bold text-text-muted"
          >
            i
          </span>
          <span>Como ler o resumo</span>
          <Icon
            className="ml-auto shrink-0 transition-transform group-open:rotate-180"
            name="chevron-down"
            size={18}
          />
        </summary>
        <div className="border-t border-border bg-surface-subtle p-5">
          <dl className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4 text-text-muted">
              <dt className="font-bold text-ink">Já estavam no campus</dt>
              <dd className="mt-1">
                Veículos que entraram antes da data e ainda estavam no campus
                quando o dia começou.
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 text-text-muted">
              <dt className="font-bold text-ink">Ainda estavam no campus</dt>
              <dd className="mt-1">
                {isCurrentDate
                  ? "Acessos que continuam sem saída registrada agora."
                  : "Acessos que continuavam sem saída registrada ao encerrar aquele dia."}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 text-text-muted">
              <dt className="font-bold text-ink">Já estavam em uso</dt>
              <dd className="mt-1">
                Veículos institucionais que saíram antes da data e ainda não
                tinham retornado quando o dia começou.
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 text-text-muted">
              <dt className="font-bold text-ink">Ainda estavam em uso</dt>
              <dd className="mt-1">
                {isCurrentDate
                  ? "Veículos institucionais que continuam sem retorno registrado agora."
                  : "Veículos institucionais que continuavam sem retorno registrado ao encerrar aquele dia."}
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl border border-warning-border bg-warning-surface px-4 py-3 text-xs font-medium text-warning-text">
            Esses indicadores não classificam atraso ou irregularidade.
          </p>
        </div>
      </details>
    </div>
  );
}
