import { useMemo, useState } from "react";

import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useDemo, type DemoAccessRecord } from "../demo";
import { generalAccessCategories } from "../features/access-records/model/accessCategories";

type PeriodPreset = "7" | "30" | "90" | "365" | "all" | "custom";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function stayDuration(record: DemoAccessRecord) {
  if (!record.exitAt) return "Em andamento";
  const minutes = Math.max(
    1,
    Math.round(
      (new Date(record.exitAt).getTime() - new Date(record.entryAt).getTime()) /
        60_000,
    ),
  );
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
}

export function HistoryPage() {
  const { records } = useDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [category, setCategory] = useState("todos");
  const [period, setPeriod] = useState<PeriodPreset>("30");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const selectedDays = Number(period);
    const presetStart =
      Number.isFinite(selectedDays) && selectedDays > 0
        ? new Date(now.getTime() - selectedDays * 86_400_000)
        : null;
    const customStart = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const customEnd = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return records
      .filter((record) => {
        const normalizedQuery = query.toLocaleLowerCase("pt-BR");
        const matchesQuery = [
          record.plate,
          record.driver,
          record.objective,
          record.category,
        ].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
        );
        const matchesStatus =
          status === "todos" ||
          (status === "aberto" && !record.exitAt) ||
          (status === "concluido" && Boolean(record.exitAt));
        const matchesCategory =
          category === "todos" || record.category === category;
        const entryDate = new Date(record.entryAt);
        const matchesPeriod =
          period === "all" ||
          (period === "custom" &&
            (!customStart || entryDate >= customStart) &&
            (!customEnd || entryDate <= customEnd)) ||
          (presetStart !== null && entryDate >= presetStart);

        return (
          matchesQuery && matchesStatus && matchesCategory && matchesPeriod
        );
      })
      .sort(
        (first, second) =>
          new Date(second.entryAt).getTime() -
          new Date(first.entryAt).getTime(),
      );
  }, [category, fromDate, period, query, records, status, toDate]);

  function clearFilters() {
    setQuery("");
    setStatus("todos");
    setCategory("todos");
    setPeriod("30");
    setFromDate("");
    setToDate("");
  }

  const fieldClass =
    "mt-2 min-h-11 w-full rounded-xl border border-ink/18 bg-cream/45 px-3.5 text-sm text-ink outline-none focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

  return (
    <div>
      <PageHeader
        description="Consulte entradas e saídas por período, situação, categoria, placa, condutor ou objetivo."
        eyebrow="Consulta e rastreabilidade"
        title="Histórico de acessos"
      />

      <section className="mt-7 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]">
        <div className="border-b border-ink/8 bg-[#B8C9A4]/20 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
                Filtros da consulta
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                Encontre um registro
              </h2>
            </div>
            <button
              className="min-h-10 rounded-xl px-3 text-sm font-bold text-brand-dark hover:bg-white focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
              onClick={clearFilters}
              type="button"
            >
              Limpar filtros
            </button>
          </div>

          <fieldset className="mt-5">
            <legend className="text-xs font-bold uppercase tracking-[0.12em] text-ink/55">
              Período
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["7", "7 dias"],
                ["30", "30 dias"],
                ["90", "90 dias"],
                ["365", "12 meses"],
                ["all", "Todo o histórico"],
                ["custom", "Personalizado"],
              ].map(([value, label]) => (
                <button
                  aria-pressed={period === value}
                  className={`min-h-9 rounded-full border px-3.5 text-xs font-bold transition ${
                    period === value
                      ? "border-ink bg-ink text-white"
                      : "border-ink/15 bg-white/75 text-ink/70 hover:border-ink/35"
                  }`}
                  key={value}
                  onClick={() => setPeriod(value as PeriodPreset)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="history-search"
              >
                Busca
              </label>
              <div className="relative mt-2">
                <Icon
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50"
                  name="search"
                />
                <input
                  className="min-h-11 w-full rounded-xl border border-ink/18 bg-cream/45 pl-12 pr-4 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20"
                  id="history-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Placa, condutor, destino ou motivo"
                  type="search"
                  value={query}
                />
              </div>
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="history-status"
              >
                Situação
              </label>
              <select
                className={fieldClass}
                id="history-status"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="todos">Todas</option>
                <option value="aberto">Em aberto</option>
                <option value="concluido">Concluídos</option>
              </select>
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="history-category"
              >
                Categoria
              </label>
              <select
                className={fieldClass}
                id="history-category"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option value="todos">Todas</option>
                {generalAccessCategories.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {period === "custom" && (
            <div className="mt-4 grid gap-4 rounded-2xl border border-ink/10 bg-cream/30 p-4 sm:grid-cols-2">
              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="history-from"
                >
                  Data inicial
                </label>
                <input
                  className={fieldClass}
                  id="history-from"
                  onChange={(event) => setFromDate(event.target.value)}
                  type="date"
                  value={fromDate}
                />
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="history-to"
                >
                  Data final
                </label>
                <input
                  className={fieldClass}
                  id="history-to"
                  onChange={(event) => setToDate(event.target.value)}
                  type="date"
                  value={toDate}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 pt-5">
            <div>
              <p className="font-bold text-ink">
                {filteredRecords.length} registro(s)
              </p>
              <p className="text-xs text-ink/55">
                Os dados exibidos são fictícios e permanecem somente no
                navegador.
              </p>
            </div>
          </div>

          {filteredRecords.length === 0 && (
            <div className="mt-5 rounded-2xl border border-dashed border-ink/20 bg-cream/35 p-8 text-center">
              <p className="font-bold text-ink">Nenhum registro encontrado</p>
              <p className="mt-1 text-sm text-ink/60">
                Ajuste o período ou limpe os filtros para tentar novamente.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-3 lg:hidden">
            {filteredRecords.map((record) => (
              <article
                className="rounded-2xl border border-ink/10 bg-cream/25 p-4"
                key={record.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-ink">{record.plate}</strong>
                    <span className="text-xs text-ink/60">
                      {record.category} • #{record.id}
                    </span>
                  </div>
                  <StatusBadge
                    label={record.exitAt ? "Concluído" : "Em aberto"}
                    tone={record.exitAt ? "success" : "warning"}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink/80">
                  {record.driver}
                </p>
                <p className="mt-1 text-sm text-ink/60">{record.objective}</p>
                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/8 pt-3 text-xs">
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-ink/50">
                      Entrada
                    </dt>
                    <dd className="mt-1 text-ink/75">
                      {dateFormatter.format(new Date(record.entryAt))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-ink/50">
                      Permanência
                    </dt>
                    <dd className="mt-1 text-ink/75">{stayDuration(record)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Histórico fictício de acessos com filtros por período
              </caption>
              <thead>
                <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.12em] text-ink/50">
                  <th className="px-3 py-3" scope="col">
                    Data e veículo
                  </th>
                  <th className="px-3 py-3" scope="col">
                    Condutor
                  </th>
                  <th className="px-3 py-3" scope="col">
                    Objetivo
                  </th>
                  <th className="px-3 py-3" scope="col">
                    Permanência
                  </th>
                  <th className="px-3 py-3" scope="col">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    className="border-b border-ink/6 align-top last:border-0 hover:bg-cream/25"
                    key={record.id}
                  >
                    <td className="px-3 py-4">
                      <strong className="block text-ink">{record.plate}</strong>
                      <span className="mt-1 block whitespace-nowrap text-xs text-ink/55">
                        {dateFormatter.format(new Date(record.entryAt))}
                      </span>
                      <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-wider text-brand-dark">
                        {record.category}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-ink/75">
                      <span className="font-medium">{record.driver}</span>
                    </td>
                    <td className="px-3 py-4 text-ink/75">
                      <span className="font-medium">{record.objective}</span>
                    </td>
                    <td className="px-3 py-4 text-ink/70">
                      {stayDuration(record)}
                      {record.exitAt && (
                        <span className="mt-1 block whitespace-nowrap text-xs text-ink/50">
                          Saída {dateFormatter.format(new Date(record.exitAt))}
                        </span>
                      )}
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
        </div>
      </section>
    </div>
  );
}
