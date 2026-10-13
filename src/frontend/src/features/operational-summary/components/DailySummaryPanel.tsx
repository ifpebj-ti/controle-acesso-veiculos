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
      className="summary-primary-metric p-4 sm:p-5"
      data-tone={metric.tone}
    >
      <div className="flex items-start gap-3.5">
        <span className="summary-primary-metric__icon">
          <Icon className={metric.iconClassName} name={metric.icon} size={24} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-soft">{metric.label}</p>
          <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-ink">
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
  return (
    <dl className="movement-summary-grid mt-4 grid gap-3 sm:grid-cols-2">
      {metrics.map((metric) => (
        <div
          className="movement-summary-item"
          data-empty={metric.value === 0 ? "true" : undefined}
          key={metric.label}
        >
          <dt className="text-xs font-medium leading-5 text-text-muted">
            {metric.label}
          </dt>
          <dd className="mt-1 text-2xl font-semibold leading-none tabular-nums text-text">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PanelHeader({
  icon,
  linkLabel,
  linkTo,
  title,
}: {
  icon: IconName;
  linkLabel?: string;
  linkTo?: string;
  title: string;
}) {
  return (
    <div className="operational-panel-header flex items-center gap-3 border-b px-5 py-4">
      <span
        aria-hidden="true"
        className="operational-panel-header__icon grid size-9 shrink-0 place-items-center rounded-full"
      >
        <Icon name={icon} size={19} />
      </span>
      <h3 className="font-semibold text-text">{title}</h3>
      {linkLabel && linkTo && (
        <Link
          className="ml-auto rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus:outline-3 focus:outline-offset-2 focus:outline-focus"
          to={linkTo}
        >
          {linkLabel}
        </Link>
      )}
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(17rem,0.72fr)]">
        <article className="operational-breakdown-panel overflow-hidden rounded-2xl border bg-surface">
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

        <article className="operational-breakdown-panel overflow-hidden rounded-2xl border bg-surface">
          <PanelHeader
            icon="bus"
            linkLabel="Ver utilizações"
            linkTo="/utilizacoes-institucionais"
            title="Frota institucional"
          />
          <div className="p-5">
            <p className="text-sm leading-6 text-ink-soft">
              Saídas e retornos registrados para os veículos institucionais.
            </p>
            <MovementRows metrics={institutionalMetrics} />
          </div>
        </article>

        <article className="operational-breakdown-panel overflow-hidden rounded-2xl border bg-surface">
          <PanelHeader icon="calendar" title="Eventos" />
          <div className="p-5">
            <p className="text-sm leading-6 text-ink-soft">
              Entradas gerais vinculadas a autorizações de eventos.
            </p>
            <dl className="mt-4 grid gap-3">
              <div
                className="movement-summary-item movement-summary-item--event"
                data-empty={
                  summary.eventAccess.entries === 0 ? "true" : undefined
                }
              >
                <dt className="text-xs font-medium text-text-muted">
                  Entradas vinculadas
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-text">
                  {summary.eventAccess.entries}
                </dd>
              </div>
              <div
                className="movement-summary-item movement-summary-item--event"
                data-empty={
                  summary.eventAccess.eventsWithEntries === 0
                    ? "true"
                    : undefined
                }
              >
                <dt className="text-xs font-medium text-text-muted">
                  Eventos com entradas
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-text">
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
