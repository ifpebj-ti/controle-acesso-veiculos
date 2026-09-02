import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Icon } from "../components/ui/Icon";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useDemo } from "../demo";
import {
  profileLabels,
  useAuthenticatedSession,
} from "../features/authentication";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  weekday: "long",
  year: "numeric",
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

export function DashboardPage() {
  const { records } = useDemo();
  const { user } = useAuthenticatedSession();
  const profile = user.profileName;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const openRecords = records.filter((record) => !record.exitAt);
  const completedRecords = records.filter((record) => record.exitAt);
  const institutionalRecords = records.filter(
    (record) => record.type === "Institucional",
  );
  const overdueRecords = openRecords.filter(
    (record) =>
      record.expectedExitAt &&
      new Date(record.expectedExitAt).getTime() < now.getTime(),
  );
  const retentionLimit = new Date(now);
  retentionLimit.setFullYear(retentionLimit.getFullYear() - 5);
  const retentionRecords = records.filter(
    (record) =>
      record.exitAt &&
      new Date(record.exitAt).getTime() <= retentionLimit.getTime(),
  );
  const profileLabel = profileLabels[profile];

  const indicators = [
    {
      detail: "Pessoas ou veículos no campus",
      label: "Acessos em aberto",
      surface: "bg-[#BDD8F1]/45",
      value: openRecords.length,
    },
    {
      detail: "Registros finalizados hoje",
      label: "Saídas registradas",
      surface: "bg-[#C8CE72]/35",
      value: completedRecords.length,
    },
    {
      detail: "Veículos institucionais em uso",
      label: "Frota em movimento",
      surface: "bg-[#B8C9A4]/50",
      value: institutionalRecords.length,
    },
    {
      detail:
        profile === "Administrador"
          ? "Registros aguardando decisão administrativa"
          : profile === "SetorTransporte"
            ? "Autorizações previstas no dia"
            : "Saídas não registradas após a previsão",
      label:
        profile === "Administrador"
          ? "Revisão de retenção"
          : profile === "SetorTransporte"
            ? "Eventos ativos"
            : "Prazos excedidos",
      surface:
        profile === "Administrador" || overdueRecords.length > 0
          ? "bg-[#EFD780]/45"
          : "bg-[#C8CE72]/35",
      value:
        profile === "Administrador"
          ? retentionRecords.length
          : profile === "SetorTransporte"
            ? 2
            : overdueRecords.length,
    },
  ];

  return (
    <div className="min-w-0">
      <header className="flex flex-col gap-6 border-b border-ink/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-dark">
            Controle de acesso • Campus Belo Jardim
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {greetingForHour(now.getHours())}, {profileLabel}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65 sm:text-base">
            Acompanhe a movimentação do campus e encontre rapidamente o que
            precisa para o turno de hoje.
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
        className="mt-7 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-dark">
              Situação atual
            </p>
            <h2
              className="mt-1 font-display text-2xl text-ink"
              id="daily-summary-title"
            >
              Resumo de hoje
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#B8C9A4]/45 px-3 py-1.5 text-xs font-bold text-ink/70">
            <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
            Operação normal
          </span>
        </div>

        <div className="grid gap-px bg-ink/8 sm:grid-cols-2 xl:grid-cols-4">
          {indicators.map((indicator) => (
            <article
              className={`${indicator.surface} min-h-36 p-5 sm:p-6`}
              key={indicator.label}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="max-w-32 text-sm font-bold leading-5 text-ink/75">
                  {indicator.label}
                </p>
                <strong className="font-display text-4xl font-normal leading-none text-ink">
                  {indicator.value.toString().padStart(2, "0")}
                </strong>
              </div>
              <p className="mt-6 text-xs leading-5 text-ink/60">
                {indicator.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-7 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)]">
        <section
          aria-labelledby="recent-movements-title"
          className="min-w-0 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_12px_35px_rgba(1,36,40,0.05)] sm:p-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-dark">
                Portaria
              </p>
              <h2
                className="mt-1 font-display text-3xl text-ink"
                id="recent-movements-title"
              >
                Movimentações recentes
              </h2>
              <p className="mt-2 text-sm text-ink/55">
                Últimos registros realizados no campus.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-brand-dark hover:bg-[#B8C9A4]/30 focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30"
              to="/acessos/historico"
            >
              Ver histórico <Icon name="arrow-right" size={17} />
            </Link>
          </div>

          <div className="mt-6 space-y-3 sm:hidden">
            {records.slice(0, 4).map((record) => (
              <article
                className="rounded-2xl border border-ink/10 bg-cream/35 p-4"
                key={record.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-ink">{record.plate}</strong>
                    <span className="text-xs text-ink/60">{record.driver}</span>
                  </div>
                  <StatusBadge
                    label={record.exitAt ? "Concluído" : "Em aberto"}
                    tone={record.exitAt ? "success" : "warning"}
                  />
                </div>
                <p className="mt-3 border-t border-ink/8 pt-3 text-xs leading-5 text-ink/65">
                  {record.destination} •{" "}
                  {dateTimeFormatter.format(new Date(record.entryAt))}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 hidden max-w-full overflow-x-auto sm:block">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Movimentações recentes do campus
              </caption>
              <thead>
                <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.12em] text-ink/50">
                  <th className="px-3 py-3 font-bold" scope="col">
                    Veículo
                  </th>
                  <th className="px-3 py-3 font-bold" scope="col">
                    Condutor
                  </th>
                  <th className="px-3 py-3 font-bold" scope="col">
                    Destino
                  </th>
                  <th className="px-3 py-3 font-bold" scope="col">
                    Entrada
                  </th>
                  <th className="px-3 py-3 font-bold" scope="col">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 4).map((record) => (
                  <tr
                    className="border-b border-ink/6 last:border-0"
                    key={record.id}
                  >
                    <td className="px-3 py-4">
                      <strong className="block text-ink">{record.plate}</strong>
                      <span className="text-xs text-ink/55">{record.type}</span>
                    </td>
                    <td className="px-3 py-4 text-ink/70">{record.driver}</td>
                    <td className="px-3 py-4 text-ink/70">
                      {record.destination}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-ink/70">
                      {dateTimeFormatter.format(new Date(record.entryAt))}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge
                        label={record.exitAt ? "Concluído" : "Em aberto"}
                        tone={record.exitAt ? "success" : "warning"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section
            aria-labelledby="shift-notes-title"
            className="rounded-[2rem] border border-[#EFD780] bg-[#EFD780]/35 p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#FFE67C] text-ink">
                <Icon name="clipboard" size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/55">
                  Turno atual
                </p>
                <h2
                  className="font-display text-xl text-ink"
                  id="shift-notes-title"
                >
                  Pontos de atenção
                </h2>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-5 text-ink/70">
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-[#c90f11]"
                />
                {profile === "Administrador"
                  ? `${retentionRecords.length} registro(s) aguardam revisão de retenção.`
                  : `${openRecords.length} acessos permanecem sem registro de saída.`}
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                />
                {profile === "Administrador"
                  ? "Contas devem ser individuais e vinculadas ao perfil correto."
                  : `${overdueRecords.length} acesso(s) ultrapassaram a previsão.`}
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                />
                Nenhuma ocorrência crítica registrada.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
