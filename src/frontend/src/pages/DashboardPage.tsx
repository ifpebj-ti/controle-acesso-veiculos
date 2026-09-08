import { useEffect, useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import {
  profileLabels,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  DailySummaryPanel,
  SummaryDateFilter,
  useOperationalSummary,
} from "../features/operational-summary";

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  weekday: "long",
  year: "numeric",
});

const summaryDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
});

const clockFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  second: "2-digit",
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

export function DashboardPage() {
  const { user } = useAuthenticatedSession();
  const operationalSummary = useOperationalSummary();
  const [now, setNow] = useState(() => new Date());

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

  return (
    <div className="min-w-0">
      <header className="flex flex-col gap-6 border-b border-ink/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-dark">
            Controle de acesso • Campus Belo Jardim
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {greetingForHour(now.getHours())}, {profileLabels[user.profileName]}
            .
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65 sm:text-base">
            Consulte os totais operacionais consolidados pela API para
            acompanhar o dia e apoiar a troca de turno.
          </p>
        </div>

        <div className="shrink-0 border-l-4 border-[#BDD8F1] pl-4 text-left lg:min-w-72 lg:text-right">
          <p className="text-sm font-semibold text-ink/65">
            {capitalize(fullDateFormatter.format(now))}
          </p>
          <time
            className="mt-1 block font-mono text-3xl font-semibold tracking-[0.08em] text-ink"
            dateTime={now.toISOString()}
          >
            {clockFormatter.format(now)}
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
              Consulta integrada
            </p>
            <h2
              className="mt-1 font-display text-3xl text-ink"
              id="daily-summary-title"
            >
              Resumo operacional diário
            </h2>
            {operationalSummary.summary && (
              <p className="mt-2 text-sm text-ink/60">
                {capitalize(
                  formatSummaryDate(operationalSummary.summary.localDate),
                )}{" "}
                • Fuso {operationalSummary.summary.timeZoneId}
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
          <div
            className="mt-6 rounded-2xl bg-cream/60 p-6 text-sm font-semibold text-ink/65"
            role="status"
          >
            Carregando resumo operacional…
          </div>
        )}

        {operationalSummary.status === "error" && (
          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900"
            role="alert"
          >
            <div>
              <h3 className="font-bold">Resumo indisponível</h3>
              <p className="mt-1">{operationalSummary.errorMessage}</p>
            </div>
            <button
              className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
              onClick={operationalSummary.retry}
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {operationalSummary.status === "ready" &&
          operationalSummary.summary && (
            <DailySummaryPanel summary={operationalSummary.summary} />
          )}
      </section>

      <aside className="mt-6 rounded-3xl border border-[#EFD780] bg-[#EFD780]/30 p-5 text-sm leading-6 text-ink/70 sm:p-6">
        <h2 className="font-display text-xl text-ink">
          Como interpretar o resumo
        </h2>
        <p className="mt-2">
          “No início” inclui registros recebidos do dia anterior. “No fim”
          mostra os que permanecem abertos ao final do período consultado. Esses
          totais não classificam atraso, irregularidade ou fechamento formal de
          turno.
        </p>
      </aside>
    </div>
  );
}
