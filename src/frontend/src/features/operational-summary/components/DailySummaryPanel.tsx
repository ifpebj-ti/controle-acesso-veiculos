import type { DailyOperationalSummary } from "../types";

interface DailySummaryPanelProps {
  summary: DailyOperationalSummary;
}

interface Metric {
  label: string;
  value: number;
}

function SummaryGroup({
  description,
  metrics,
  title,
}: {
  description: string;
  metrics: Metric[];
  title: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface-subtle p-5 sm:p-6">
      <h3 className="text-xl font-bold text-text">{title}</h3>
      <p className="mt-1 min-h-10 text-xs leading-5 text-ink-soft">
        {description}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div
            className="rounded-xl border border-border bg-surface p-3"
            key={metric.label}
          >
            <dt className="text-xs font-semibold leading-4 text-ink-soft">
              {metric.label}
            </dt>
            <dd className="mt-2 text-3xl font-bold tabular-nums text-text">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function DailySummaryPanel({ summary }: DailySummaryPanelProps) {
  const groups = [
    {
      description: "Movimentações registradas pela portaria no fluxo geral.",
      metrics: [
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
      ],
      title: "Acessos gerais",
    },
    {
      description: "Saídas e retornos realizados com a frota institucional.",
      metrics: [
        { label: "Saídas", value: summary.institutionalUsages.departures },
        { label: "Retornos", value: summary.institutionalUsages.returns },
        {
          label: "Já estavam em uso",
          value: summary.institutionalUsages.openAtStart,
        },
        {
          label: "Ainda estavam em uso",
          value: summary.institutionalUsages.openAtEnd,
        },
      ],
      title: "Frota institucional",
    },
    {
      description: "Entradas gerais associadas a autorizações de eventos.",
      metrics: [
        { label: "Entradas vinculadas", value: summary.eventAccess.entries },
        {
          label: "Eventos com entradas",
          value: summary.eventAccess.eventsWithEntries,
        },
      ],
      title: "Eventos",
    },
  ];
  const totalMovements =
    summary.generalAccess.entries +
    summary.generalAccess.exits +
    summary.institutionalUsages.departures +
    summary.institutionalUsages.returns +
    summary.eventAccess.entries;

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
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {groups.map((group) => (
          <SummaryGroup {...group} key={group.title} />
        ))}
      </div>
    </>
  );
}
