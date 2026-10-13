import { Link } from "react-router-dom";

import { Icon, type IconName } from "../../../components/ui/Icon";
import type { DailyOperationalSummary } from "../types";

interface DailySummaryPanelProps {
  summary: DailyOperationalSummary;
}

interface PrimaryMetric {
  description: string;
  icon: IconName;
  iconClassName?: string;
  label: string;
  tone: "blue" | "green" | "purple" | "yellow";
  value: number;
}

interface MovementMetric {
  label: string;
  value: number;
}

function PrimaryMetricCard({ metric }: { metric: PrimaryMetric }) {
  return (
    <article
      className="summary-primary-metric rounded-2xl border p-4 sm:p-5"
      data-tone={metric.tone}
    >
      <div className="flex items-start gap-4">
        <span className="summary-primary-metric__icon">
          <Icon className={metric.iconClassName} name={metric.icon} size={27} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{metric.label}</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink">
            {metric.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            {metric.description}
          </p>
        </div>
      </div>
    </article>
  );
}

function MovementRows({ metrics }: { metrics: MovementMetric[] }) {
  const largestValue = Math.max(1, ...metrics.map(({ value }) => value));

  return (
    <div className="mt-4 grid gap-3">
      {metrics.map((metric) => (
        <div className="grid gap-2" key={metric.label}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-ink-soft">{metric.label}</span>
            <strong className="font-bold tabular-nums text-ink">
              {metric.value}
            </strong>
          </div>
          <div
            aria-hidden="true"
            className="h-2 overflow-hidden rounded-full bg-surface-subtle"
          >
            <div
              className="h-full min-w-1 rounded-full bg-primary"
              style={{ width: `${(metric.value / largestValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelHeader({
  icon,
  linkLabel,
  linkTo,
  title,
}: {
  icon: IconName;
  linkLabel: string;
  linkTo: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-4">
      <Icon className="text-primary" name={icon} size={22} />
      <h3 className="font-bold text-ink">{title}</h3>
      <Link
        className="ml-auto rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus:outline-3 focus:outline-offset-2 focus:outline-focus"
        to={linkTo}
      >
        {linkLabel}
      </Link>
    </div>
  );
}

export function DailySummaryPanel({ summary }: DailySummaryPanelProps) {
  const primaryMetrics: PrimaryMetric[] = [
    {
      description: "registros na data selecionada",
      icon: "log-out",
      iconClassName: "rotate-180",
      label: "Entradas gerais",
      tone: "green",
      value: summary.generalAccess.entries,
    },
    {
      description: "registros na data selecionada",
      icon: "log-out",
      label: "Saídas gerais",
      tone: "blue",
      value: summary.generalAccess.exits,
    },
    {
      description: "ainda estavam no campus",
      icon: "clock",
      label: "Acessos em circulação",
      tone: "yellow",
      value: summary.generalAccess.openAtEnd,
    },
    {
      description: "ainda estavam em uso",
      icon: "bus",
      label: "Frota institucional",
      tone: "purple",
      value: summary.institutionalUsages.openAtEnd,
    },
  ];
  const generalMetrics: MovementMetric[] = [
    { label: "Entradas", value: summary.generalAccess.entries },
    { label: "Saídas", value: summary.generalAccess.exits },
    {
      label: "Já estavam no campus",
      value: summary.generalAccess.openAtStart,
    },
    {
      label: "Ainda estavam no campus",
      value: summary.generalAccess.openAtEnd,
    },
  ];
  const institutionalMetrics: MovementMetric[] = [
    { label: "Saídas da frota", value: summary.institutionalUsages.departures },
    { label: "Retornos da frota", value: summary.institutionalUsages.returns },
    {
      label: "Já estavam em uso",
      value: summary.institutionalUsages.openAtStart,
    },
    {
      label: "Ainda estavam em uso",
      value: summary.institutionalUsages.openAtEnd,
    },
  ];
  const totalMovements =
    summary.generalAccess.entries +
    summary.generalAccess.exits +
    summary.institutionalUsages.departures +
    summary.institutionalUsages.returns;

  return (
    <>
      {totalMovements === 0 && (
        <p
          className="mt-5 rounded-xl border border-border bg-surface-subtle p-4 text-sm text-text-muted"
          role="status"
        >
          Nenhuma movimentação foi contabilizada nesta data. Os registros
          abertos no início ou no fim do período continuam indicados abaixo.
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {primaryMetrics.map((metric) => (
          <PrimaryMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-border bg-surface">
          <PanelHeader
            icon="dashboard"
            linkLabel="Ver histórico"
            linkTo="/acessos/historico"
            title="Acessos gerais"
          />
          <div className="p-5">
            <p className="text-sm leading-6 text-ink-soft">
              Movimentações registradas pela portaria no fluxo geral.
            </p>
            <MovementRows metrics={generalMetrics} />
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-border bg-surface">
          <PanelHeader
            icon="bus"
            linkLabel="Ver utilizações"
            linkTo="/utilizacoes-institucionais"
            title="Frota institucional"
          />
          <div className="p-5">
            <p className="text-sm leading-6 text-ink-soft">
              Movimentações da frota e entradas vinculadas a autorizações.
            </p>
            <MovementRows metrics={institutionalMetrics} />
            <h4 className="mt-5 border-t border-border pt-4 font-bold text-ink">
              Eventos
            </h4>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-success-surface p-4">
                <dt className="text-xs font-semibold text-success-text">
                  Entradas vinculadas
                </dt>
                <dd className="mt-2 text-2xl font-extrabold tabular-nums text-ink">
                  {summary.eventAccess.entries}
                </dd>
              </div>
              <div className="rounded-xl bg-surface-subtle p-4">
                <dt className="text-xs font-semibold text-ink-soft">
                  Eventos com entradas
                </dt>
                <dd className="mt-2 text-2xl font-extrabold tabular-nums text-ink">
                  {summary.eventAccess.eventsWithEntries}
                </dd>
              </div>
            </dl>
          </div>
        </article>
      </div>
    </>
  );
}
