import { Link } from "react-router-dom";

import { Icon, type IconName } from "../../../components/ui/Icon";
import {
  MetricCard,
  type MetricCardTone,
} from "../../../components/ui/MetricCard";
import { SectionPanel } from "../../../components/ui/SectionPanel";
import type {
  DailyAccessTotals,
  DailyOperationalSummary,
  HourlyAccessTotals,
  NamedOperationalCount,
} from "../types";

interface AdministrativeSummaryPanelProps {
  summary: DailyOperationalSummary;
}

interface MetricData {
  description: string;
  icon: IconName;
  label: string;
  tone: MetricCardTone;
  value: number | string;
}

interface DistributionItem extends NamedOperationalCount {
  color: string;
  percentage: number;
}

const chartColors = [
  "var(--ui-data-1)",
  "var(--ui-data-2)",
  "var(--ui-data-3)",
  "var(--ui-data-4)",
  "var(--ui-data-5)",
  "var(--ui-data-6)",
];

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const compactDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

function parseLocalDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatShortDate(value: string) {
  return shortDateFormatter.format(parseLocalDate(value));
}

function formatCompactDate(value: string) {
  return compactDateFormatter.format(parseLocalDate(value));
}

function PanelLink({ to }: { to: string }) {
  return (
    <Link
      className="rounded-md text-xs font-semibold text-primary underline-offset-4 hover:underline focus:outline-3 focus:outline-offset-2 focus:outline-focus"
      to={to}
    >
      Ver todos
    </Link>
  );
}

function EmptyChart({ children }: { children: string }) {
  return (
    <div
      className="m-5 flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-subtle/45 px-5 text-center text-sm text-text-muted"
      role="status"
    >
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-full bg-surface text-primary"
      >
        <Icon name="dashboard" size={20} />
      </span>
      <p className="max-w-sm leading-6">{children}</p>
    </div>
  );
}

function ChartLegend() {
  return (
    <ul
      aria-label="Legenda do gráfico"
      className="mb-4 flex flex-wrap justify-end gap-3 text-xs text-text-muted"
    >
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full bg-[var(--ui-data-1)]"
        />
        Entradas
      </li>
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full bg-[var(--ui-data-3)]"
        />
        Saídas
      </li>
    </ul>
  );
}

function HourlyAccessChart({
  localDate,
  values,
}: {
  localDate: string;
  values: HourlyAccessTotals[];
}) {
  const total = values.reduce(
    (result, item) => result + item.entries + item.exits,
    0,
  );

  if (total === 0) {
    return (
      <EmptyChart>
        {`Nenhuma entrada ou saída foi registrada em ${formatShortDate(localDate)}.`}
      </EmptyChart>
    );
  }

  const maximum = Math.max(
    1,
    ...values.flatMap((item) => [item.entries, item.exits]),
  );
  const toPoints = (selector: (item: HourlyAccessTotals) => number) =>
    values
      .map((item, index) => {
        const x =
          values.length === 1 ? 300 : (index / (values.length - 1)) * 600;
        const y = 188 - (selector(item) / maximum) * 148;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <figure className="p-4 sm:p-5">
      <ChartLegend />
      <div className="analytics-flow-chart relative h-56 overflow-hidden rounded-lg border">
        <svg
          aria-hidden="true"
          className="absolute inset-0 size-full"
          preserveAspectRatio="none"
          viewBox="0 0 600 220"
        >
          <polyline
            fill="none"
            points={toPoints((item) => item.entries)}
            stroke="var(--ui-data-1)"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <polyline
            fill="none"
            points={toPoints((item) => item.exits)}
            stroke="var(--ui-data-3)"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {values.flatMap((item, index) => {
            const x = (index / (values.length - 1)) * 600;
            return (
              [
                [item.entries, "var(--ui-data-1)"],
                [item.exits, "var(--ui-data-3)"],
              ] as const
            )
              .filter(([count]) => count > 0)
              .map(([count, color]) => (
                <circle
                  cx={x}
                  cy={188 - (count / maximum) * 148}
                  fill={color}
                  key={`${item.hour}-${color}`}
                  r="4"
                  stroke="var(--ui-surface)"
                  strokeWidth="2"
                />
              ));
          })}
        </svg>
        <div className="absolute inset-x-3 bottom-2 flex justify-between text-[0.65rem] text-text-muted">
          <span>0h</span>
          <span>6h</span>
          <span>12h</span>
          <span>18h</span>
          <span>23h</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>
          Entradas e saídas por hora em {formatShortDate(localDate)}
        </caption>
        <thead>
          <tr>
            <th scope="col">Hora</th>
            <th scope="col">Entradas</th>
            <th scope="col">Saídas</th>
          </tr>
        </thead>
        <tbody>
          {values.map((item) => (
            <tr key={item.hour}>
              <th scope="row">{item.hour}h</th>
              <td>{item.entries}</td>
              <td>{item.exits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function DistributionChart({
  centerLabel,
  emptyMessage,
  values,
}: {
  centerLabel: string;
  emptyMessage: string;
  values: NamedOperationalCount[];
}) {
  const total = values.reduce((result, item) => result + item.count, 0);

  if (total === 0) return <EmptyChart>{emptyMessage}</EmptyChart>;

  const items: DistributionItem[] = values
    .filter((item) => item.count > 0)
    .map((item, index) => ({
      ...item,
      color: chartColors[index % chartColors.length],
      percentage: (item.count / total) * 100,
    }));
  const gradient = items.reduce<{ cursor: number; stops: string[] }>(
    (result, item) => {
      const start = result.cursor;
      const end = start + item.percentage;
      return {
        cursor: end,
        stops: [...result.stops, `${item.color} ${start}% ${end}%`],
      };
    },
    { cursor: 0, stops: [] },
  );

  return (
    <figure className="grid items-center gap-5 p-5 sm:grid-cols-[8.5rem_1fr]">
      <div
        aria-hidden="true"
        className="relative mx-auto size-32 rounded-full"
        style={{ background: `conic-gradient(${gradient.stops.join(", ")})` }}
      >
        <span className="absolute inset-[24%] grid place-content-center rounded-full bg-surface text-center shadow-[inset_0_1px_2px_rgba(1,36,40,0.06)]">
          <strong className="whitespace-nowrap text-sm font-semibold leading-tight text-text">
            {centerLabel}
          </strong>
          <small className="mt-1 text-xs tabular-nums text-text-muted">
            {total}
          </small>
        </span>
      </div>
      <dl className="grid min-w-0 gap-2 text-xs sm:text-sm">
        {items.map((item) => (
          <div
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/35 pb-2 last:border-0 last:pb-0"
            key={item.label}
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <dt className="break-words text-text-muted">{item.label}</dt>
            <dd className="text-right font-medium tabular-nums text-text-muted">
              {item.count} ({percentageFormatter.format(item.percentage)}%)
            </dd>
          </div>
        ))}
      </dl>
      <p className="sr-only">
        {items
          .map(
            (item) =>
              `${item.label}: ${item.count}, ${percentageFormatter.format(item.percentage)} por cento`,
          )
          .join("; ")}
      </p>
    </figure>
  );
}

function DailyAccessChart({ values }: { values: DailyAccessTotals[] }) {
  const total = values.reduce(
    (result, item) => result + item.entries + item.exits,
    0,
  );

  if (total === 0) {
    const firstDate = values[0]?.localDate;
    const lastDate = values.at(-1)?.localDate;
    return (
      <EmptyChart>
        {firstDate && lastDate
          ? `Nenhuma entrada ou saída foi registrada entre ${formatShortDate(firstDate)} e ${formatShortDate(lastDate)}.`
          : "Nenhuma entrada ou saída foi registrada no período informado."}
      </EmptyChart>
    );
  }

  const maximum = Math.max(
    1,
    ...values.flatMap((item) => [item.entries, item.exits]),
  );

  return (
    <figure className="p-4 sm:p-5">
      <ChartLegend />
      <div className="overflow-x-auto pb-1">
        <div
          aria-hidden="true"
          className="flex h-52 min-w-[40rem] items-end gap-2"
        >
          {values.map((item) => (
            <div
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
              key={item.localDate}
            >
              <div className="flex h-[10rem] items-end justify-center gap-1">
                <span
                  className="w-[34%] rounded-t-sm bg-[var(--ui-data-1)]"
                  style={{ height: `${(item.entries / maximum) * 100}%` }}
                />
                <span
                  className="w-[34%] rounded-t-sm bg-[var(--ui-data-3)]"
                  style={{ height: `${(item.exits / maximum) * 100}%` }}
                />
              </div>
              <span className="mt-2 text-center text-[0.62rem] text-text-muted">
                {formatCompactDate(item.localDate)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>Entradas e saídas nos 14 dias do período apresentado</caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Entradas</th>
            <th scope="col">Saídas</th>
          </tr>
        </thead>
        <tbody>
          {values.map((item) => (
            <tr key={item.localDate}>
              <th scope="row">{formatShortDate(item.localDate)}</th>
              <td>{item.entries}</td>
              <td>{item.exits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function selectedDateDescription(localDate: string) {
  return `Dados de ${formatShortDate(localDate)}`;
}

function recentPeriodDescription(values: DailyAccessTotals[]) {
  const firstDate = values[0]?.localDate;
  const lastDate = values.at(-1)?.localDate;
  if (!firstDate || !lastDate) return "Período informado pela API";
  return `14 dias: ${formatShortDate(firstDate)} a ${formatShortDate(lastDate)}`;
}

export function AdministrativeSummaryPanel({
  summary,
}: AdministrativeSummaryPanelProps) {
  const metricCards: MetricData[] = [
    {
      description: "na data selecionada",
      icon: "log-out",
      label: "Total de acessos",
      tone: "forest",
      value: summary.generalAccess.entries,
    },
    {
      description: "na data selecionada",
      icon: "log-out",
      label: "Saídas registradas",
      tone: "leaf",
      value: summary.generalAccess.exits,
    },
    {
      description: "sem saída registrada",
      icon: "car",
      label: "Veículos no campus",
      tone: "sage",
      value: summary.generalAccess.openAtEnd,
    },
    {
      description: "sem retorno registrado",
      icon: "bus",
      label: "Frota em uso",
      tone: "teal",
      value: summary.institutionalUsages.openAtEnd,
    },
  ];
  const selectedPeriod = selectedDateDescription(summary.localDate);

  return (
    <div className="administrative-summary mt-5">
      <div className="institutional-metric-grid grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionPanel
          action={<PanelLink to="/acessos/historico" />}
          description={selectedPeriod}
          icon="dashboard"
          title="Fluxo de acessos"
        >
          <HourlyAccessChart
            localDate={summary.localDate}
            values={summary.hourlyAccess}
          />
        </SectionPanel>
        <SectionPanel
          action={<PanelLink to="/acessos/historico" />}
          description={selectedPeriod}
          icon="dashboard"
          title="Tipos de acesso"
        >
          <DistributionChart
            centerLabel="Acessos"
            emptyMessage={`Nenhuma categoria de acesso foi contabilizada em ${formatShortDate(summary.localDate)}.`}
            values={summary.accessCategories}
          />
        </SectionPanel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionPanel
          action={<PanelLink to="/acessos/historico" />}
          description={recentPeriodDescription(summary.recentDailyAccess)}
          icon="calendar"
          title="Acessos por dia"
        >
          <DailyAccessChart values={summary.recentDailyAccess} />
        </SectionPanel>
        <SectionPanel
          action={<PanelLink to="/frota" />}
          description={selectedPeriod}
          icon="car"
          title="Veículos por tipo"
        >
          <DistributionChart
            centerLabel="Veículos"
            emptyMessage={`Nenhum tipo de veículo foi contabilizado nos acessos de ${formatShortDate(summary.localDate)}.`}
            values={summary.vehicleTypes}
          />
        </SectionPanel>
      </div>
    </div>
  );
}
