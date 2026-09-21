import { useEffect, useMemo, useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { ContentState } from "../components/ui/ContentState";
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
      <header className="sticky top-16 z-10 -mx-4 flex flex-col gap-6 border-b border-ink/10 bg-cream/95 px-4 pb-7 pt-1 shadow-[0_10px_24px_rgba(1,36,40,0.04)] backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-9 lg:flex-row lg:items-end lg:justify-between lg:px-9 lg:pt-0">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-dark">
            Controle de acesso • Campus Belo Jardim
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {greetingForHour(currentInstitutionalTime.hour)},{" "}
            {profileLabels[user.profileName]}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
            Acompanhe as movimentações e a situação dos acessos do dia.
          </p>
        </div>

        <div className="shrink-0 border-l-4 border-[#BDD8F1] pl-4 text-left lg:min-w-72 lg:text-right">
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

      <section
        aria-labelledby="daily-summary-title"
        className="mt-7 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_12px_35px_rgba(1,36,40,0.05)] sm:p-7"
      >
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-dark">
              Movimentações do dia
            </p>
            <h2
              className="mt-3 font-display text-3xl text-ink"
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
              <button
                className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-700/30"
                onClick={operationalSummary.retry}
                type="button"
              >
                Tentar novamente
              </button>
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
      </section>

      <details className="group mt-6 overflow-hidden rounded-3xl border border-[#1A615D]/20 bg-white text-sm leading-6 shadow-[0_10px_30px_rgba(0,73,83,0.06)]">
        <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4 font-bold text-ink transition-colors hover:bg-brand-soft/15 focus:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-brand/30 [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft/35 font-display text-lg text-ink-soft"
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
        <div className="border-t border-[#1A615D]/15 bg-cream/45 p-5">
          <dl className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#BDD8F1] bg-white/80 p-4 text-ink-soft">
              <dt className="font-bold text-ink">Já estavam no campus</dt>
              <dd className="mt-1">
                Veículos que entraram antes da data e ainda estavam no campus
                quando o dia começou.
              </dd>
            </div>
            <div className="rounded-2xl border border-[#BDD8F1] bg-white/80 p-4 text-ink-soft">
              <dt className="font-bold text-ink">Ainda estavam no campus</dt>
              <dd className="mt-1">
                {isCurrentDate
                  ? "Acessos que continuam sem saída registrada agora."
                  : "Acessos que continuavam sem saída registrada ao encerrar aquele dia."}
              </dd>
            </div>
            <div className="rounded-2xl border border-[#C8CE72] bg-white/80 p-4 text-ink-soft">
              <dt className="font-bold text-ink">Já estavam em uso</dt>
              <dd className="mt-1">
                Veículos institucionais que saíram antes da data e ainda não
                tinham retornado quando o dia começou.
              </dd>
            </div>
            <div className="rounded-2xl border border-[#C8CE72] bg-white/80 p-4 text-ink-soft">
              <dt className="font-bold text-ink">Ainda estavam em uso</dt>
              <dd className="mt-1">
                {isCurrentDate
                  ? "Veículos institucionais que continuam sem retorno registrado agora."
                  : "Veículos institucionais que continuavam sem retorno registrado ao encerrar aquele dia."}
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl bg-[#EFD780]/30 px-4 py-3 text-xs font-medium text-ink-soft">
            Esses indicadores não classificam atraso ou irregularidade.
          </p>
        </div>
      </details>
    </div>
  );
}
