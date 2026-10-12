import { Link } from "react-router-dom";

import { Icon, type IconName } from "../../../components/ui/Icon";
import {
  MetricCard,
  type MetricCardTone,
} from "../../../components/ui/MetricCard";
import { SectionPanel } from "../../../components/ui/SectionPanel";
import type { DailyOperationalSummary } from "../types";

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

interface PreviewItem {
  color: string;
  label: string;
  value: string;
}

const accessTypePreview: PreviewItem[] = [
  { color: "var(--ui-data-1)", label: "Visitante", value: "28,5%" },
  { color: "var(--ui-data-2)", label: "Prestador de serviço", value: "18,2%" },
  { color: "var(--ui-data-3)", label: "Entrega", value: "12,6%" },
  { color: "var(--ui-data-4)", label: "Evento", value: "10,4%" },
  { color: "var(--ui-data-5)", label: "Treino ou jogo", value: "8,1%" },
  { color: "var(--ui-data-6)", label: "Outros", value: "22,2%" },
];

const credentialPreview: PreviewItem[] = [
  { color: "var(--ui-data-1)", label: "Válidas", value: "72,4%" },
  {
    color:
      "color-mix(in srgb, var(--ui-warning-border) 60%, var(--ui-surface))",
    label: "Em breve",
    value: "14,1%",
  },
  {
    color: "color-mix(in srgb, var(--ui-danger-border) 62%, var(--ui-surface))",
    label: "Vencidas",
    value: "8,7%",
  },
  {
    color: "color-mix(in srgb, var(--ui-border) 54%, var(--ui-surface))",
    label: "Não emitidas",
    value: "4,8%",
  },
];

const vehicleTypePreview: PreviewItem[] = [
  { color: "var(--ui-data-1)", label: "Automóvel", value: "58,3%" },
  { color: "var(--ui-data-2)", label: "Motocicleta", value: "22,1%" },
  { color: "var(--ui-data-3)", label: "Caminhonete", value: "10,7%" },
  { color: "var(--ui-data-5)", label: "Van/Ônibus", value: "5,6%" },
  { color: "var(--ui-data-6)", label: "Outros", value: "3,3%" },
];

const dailyPreview = [42, 55, 69, 78, 61, 80, 86, 73, 76, 67, 64, 82, 70, 58];

function PreviewBadge() {
  return (
    <span className="rounded-full border border-warning-border/60 bg-warning-surface/70 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-warning-text">
      Prévia visual
    </span>
  );
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

function PreviewLegend({ items }: { items: PreviewItem[] }) {
  return (
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
          <dt className="truncate text-ink-soft">{item.label}</dt>
          <dd className="font-medium tabular-nums text-ink-soft">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PreviewDonut({
  centerLabel,
  items,
}: {
  centerLabel: string;
  items: PreviewItem[];
}) {
  const stops = items.reduce<{ cursor: number; stops: string[] }>(
    (result, item) => {
      const amount = Number(item.value.replace("%", "").replace(",", "."));
      const start = result.cursor;
      result.cursor += amount;
      result.stops.push(`${item.color} ${start}% ${result.cursor}%`);
      return result;
    },
    { cursor: 0, stops: [] },
  );

  return (
    <div className="grid items-center gap-5 p-5 sm:grid-cols-[8.5rem_1fr]">
      <div
        aria-label={`Gráfico demonstrativo: ${items.map((item) => `${item.label} ${item.value}`).join(", ")}`}
        className="relative mx-auto size-32 rounded-full"
        role="img"
        style={{ background: `conic-gradient(${stops.stops.join(", ")})` }}
      >
        <span className="absolute inset-[16%] grid place-content-center rounded-full bg-surface text-center shadow-[inset_0_1px_2px_rgba(1,36,40,0.06)]">
          <strong className="whitespace-nowrap text-sm font-semibold leading-tight text-ink">
            {centerLabel}
          </strong>
          <small className="mt-0.5 text-[0.6rem] leading-none text-ink-soft">
            prévia
          </small>
        </span>
      </div>
      <PreviewLegend items={items} />
    </div>
  );
}

function AccessFlowPreview() {
  const points = [
    [0, 177],
    [108, 140],
    [214, 96],
    [307, 130],
    [407, 136],
    [510, 143],
    [600, 160],
  ];

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex justify-end gap-1" aria-hidden="true">
        <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white">
          Entradas
        </span>
        <span className="rounded-full bg-surface-subtle px-4 py-1.5 text-xs font-bold text-ink-soft">
          Saídas
        </span>
      </div>
      <div
        aria-label="Prévia de gráfico de fluxo de acessos por horário"
        className="analytics-flow-chart relative h-56 overflow-hidden rounded-lg border"
        role="img"
      >
        <svg
          aria-hidden="true"
          className="absolute inset-0 size-full"
          preserveAspectRatio="none"
          viewBox="0 0 600 220"
        >
          <defs>
            <linearGradient id="access-flow-fill" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0"
                stopColor="var(--ui-data-2)"
                stopOpacity="0.26"
              />
              <stop
                offset="1"
                stopColor="var(--ui-data-2)"
                stopOpacity="0.02"
              />
            </linearGradient>
          </defs>
          <path
            d="M0 177 C42 150 70 137 108 140 S174 85 214 96 S265 135 307 130 S370 156 407 136 S469 155 510 143 S560 169 600 160 L600 220 L0 220 Z"
            fill="url(#access-flow-fill)"
          />
          <path
            d="M0 177 C42 150 70 137 108 140 S174 85 214 96 S265 135 307 130 S370 156 407 136 S469 155 510 143 S560 169 600 160"
            fill="none"
            stroke="var(--ui-data-1)"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          {points.map(([x, y]) => (
            <circle
              cx={x}
              cy={y}
              fill="var(--ui-data-1)"
              key={x}
              r="4"
              stroke="white"
              strokeWidth="1.5"
            />
          ))}
        </svg>
        <div className="absolute inset-x-3 bottom-2 flex justify-between text-[0.65rem] text-ink-soft">
          <span>6h</span>
          <span>9h</span>
          <span>12h</span>
          <span>15h</span>
          <span>18h</span>
          <span>21h</span>
        </div>
      </div>
    </div>
  );
}

function DailyAccessPreview() {
  return (
    <div
      aria-label="Prévia de gráfico de acessos por dia"
      className="flex h-52 items-end gap-2 p-5 pt-8"
      role="img"
    >
      {dailyPreview.map((height, index) => (
        <div
          className="flex h-full min-w-0 flex-1 flex-col justify-end"
          key={index}
        >
          <span
            aria-hidden="true"
            className={`mx-auto w-[72%] rounded-t-sm ${index === 6 ? "bg-primary" : "bg-brand-soft/55"}`}
            style={{ height: `${height}%` }}
          />
          <span className="mt-2 truncate text-center text-[0.58rem] text-ink-soft">
            {String(index + 1).padStart(2, "0")}/10
          </span>
        </div>
      ))}
    </div>
  );
}

function SectorPreview() {
  const sectors = [
    ["Entrada principal", 100],
    ["Ginásio poliesportivo", 68],
    ["Bloco acadêmico", 47],
    ["Estacionamento", 38],
    ["Outros setores", 25],
  ] as const;

  return (
    <dl className="grid gap-3 p-5">
      {sectors.map(([label, width], index) => (
        <div
          className="grid grid-cols-[8rem_1fr_auto] items-center gap-3"
          key={label}
        >
          <dt className="truncate text-xs text-ink-soft">{label}</dt>
          <dd
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-surface-subtle"
          >
            <span
              className="block h-full rounded-full bg-primary"
              style={{ opacity: 1 - index * 0.13, width: `${width}%` }}
            />
          </dd>
          <dd className="text-xs font-medium tabular-nums text-ink-soft">—</dd>
        </div>
      ))}
    </dl>
  );
}

function AlertsPreview() {
  const alerts = [
    {
      icon: "clock" as const,
      label: "Permanências acima do horário",
      tone: "border-danger-border/40 bg-danger-surface/50 text-danger-text",
    },
    {
      icon: "log-out" as const,
      label: "Saídas não registradas",
      tone: "border-warning-border/40 bg-warning-surface/50 text-warning-text",
    },
    {
      icon: "lock" as const,
      label: "Credenciais expiradas",
      tone: "border-border/35 bg-surface-subtle/55 text-text-muted",
    },
    {
      icon: "ellipsis" as const,
      label: "Informações incompletas",
      tone: "border-border/35 bg-surface-subtle/55 text-ink",
    },
  ];

  return (
    <div className="grid gap-2 p-4">
      {alerts.map((alert) => (
        <div
          className={`flex min-h-11 items-center gap-2.5 rounded-lg border px-3 ${alert.tone}`}
          key={alert.label}
        >
          <Icon name={alert.icon} size={16} />
          <span className="text-xs font-semibold">{alert.label}</span>
          <Icon className="ml-auto" name="arrow-right" size={14} />
        </div>
      ))}
    </div>
  );
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

  return (
    <div className="administrative-summary mt-5">
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-warning-border bg-warning-surface px-4 py-3 text-sm text-warning-text sm:flex-row sm:items-center">
        <strong>Prévia da área analítica</strong>
        <span className="leading-5">
          Os indicadores disponíveis usam a API. Gráficos marcados como prévia
          serão integrados em uma etapa posterior.
        </span>
      </div>

      <div className="institutional-metric-grid grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionPanel
          action={<PanelLink to="/acessos/historico" />}
          badge={<PreviewBadge />}
          icon="dashboard"
          title="Fluxo de acessos"
        >
          <AccessFlowPreview />
        </SectionPanel>
        <SectionPanel
          action={<PanelLink to="/acessos/historico" />}
          badge={<PreviewBadge />}
          icon="dashboard"
          title="Tipos de acesso"
        >
          <PreviewDonut centerLabel="Acessos" items={accessTypePreview} />
        </SectionPanel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionPanel
          action={<PanelLink to="/acessos/historico" />}
          badge={<PreviewBadge />}
          icon="calendar"
          title="Acessos por dia"
        >
          <DailyAccessPreview />
        </SectionPanel>
        <SectionPanel
          badge={<PreviewBadge />}
          icon="dashboard"
          title="Setores mais acessados"
        >
          <SectorPreview />
        </SectionPanel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <SectionPanel
          badge={<PreviewBadge />}
          icon="lock"
          title="Alertas e pendências"
        >
          <AlertsPreview />
        </SectionPanel>
        <SectionPanel
          action={<PanelLink to="/administracao" />}
          badge={<PreviewBadge />}
          icon="shield"
          title="Status das credenciais"
        >
          <PreviewDonut centerLabel="Pessoas" items={credentialPreview} />
        </SectionPanel>
        <SectionPanel
          action={<PanelLink to="/frota" />}
          badge={<PreviewBadge />}
          icon="car"
          title="Veículos por tipo"
        >
          <PreviewDonut centerLabel="Veículos" items={vehicleTypePreview} />
        </SectionPanel>
      </div>
    </div>
  );
}
