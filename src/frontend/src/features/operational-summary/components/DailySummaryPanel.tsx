import type { DailyOperationalSummary } from "../types";

interface DailySummaryPanelProps {
  summary: DailyOperationalSummary;
}

interface Metric {
  label: string;
  value: number;
}

const surfaces = ["bg-[#BDD8F1]/45", "bg-[#C8CE72]/35", "bg-[#EFD780]/40"];

function SummaryGroup({
  description,
  index,
  metrics,
  title,
}: {
  description: string;
  index: number;
  metrics: Metric[];
  title: string;
}) {
  return (
    <article className={`${surfaces[index]} rounded-3xl p-5 sm:p-6`}>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-1 min-h-10 text-xs leading-5 text-overview-ink-soft">
        {description}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div className="rounded-2xl bg-white/70 p-3" key={metric.label}>
            <dt className="text-xs font-semibold leading-4 text-overview-ink-soft">
              {metric.label}
            </dt>
            <dd className="mt-2 font-display text-3xl text-ink">
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
          className="mt-5 rounded-2xl border border-ink/10 bg-cream/55 p-4 text-sm text-overview-ink-soft"
          role="status"
        >
          Nenhuma movimentação foi contabilizada nesta data. Os registros
          abertos no início ou no fim do período continuam indicados abaixo.
        </p>
      )}
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {groups.map((group, index) => (
          <SummaryGroup {...group} index={index} key={group.title} />
        ))}
      </div>
    </>
  );
}
