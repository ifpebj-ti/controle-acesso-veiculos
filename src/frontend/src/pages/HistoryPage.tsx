import { useMemo, useState } from 'react';

import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useDemo } from '../demo';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function HistoryPage() {
  const { records } = useDemo();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const matchesQuery = [record.plate, record.driver, record.destination].some(
          (value) =>
            value.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')),
        );
        const matchesStatus =
          status === 'todos' ||
          (status === 'aberto' && !record.exitAt) ||
          (status === 'concluido' && Boolean(record.exitAt));

        return matchesQuery && matchesStatus;
      }),
    [query, records, status],
  );

  return (
    <div>
      <PageHeader
        description="Consulta transversal para apoiar Portaria, Vigilância e Transporte. Filtros e campos definitivos dependem da validação dos setores."
        eyebrow="Consulta"
        title="Histórico de acessos"
      />

      <section className="mt-8 rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(1,36,40,0.05)] sm:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_13rem]">
          <div>
            <label className="text-sm font-semibold text-ink" htmlFor="history-search">Buscar no histórico</label>
            <div className="relative mt-2">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50" name="search" />
              <input
                className="min-h-12 w-full rounded-xl border border-ink/20 bg-cream/45 pl-12 pr-4 text-ink outline-none placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20"
                id="history-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Placa, condutor ou destino"
                type="search"
                value={query}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink" htmlFor="history-status">Situação</label>
            <select
              className="mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/45 px-4 text-ink outline-none focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20"
              id="history-status"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="todos">Todos</option>
              <option value="aberto">Em aberto</option>
              <option value="concluido">Concluídos</option>
            </select>
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold text-ink/60" aria-live="polite">
          {filteredRecords.length} registro(s) na amostra
        </p>

        {filteredRecords.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-ink/20 bg-cream/35 p-8 text-center">
            <p className="font-bold text-ink">Nenhum registro encontrado</p>
            <p className="mt-1 text-sm text-ink/60">Ajuste ou limpe os filtros para tentar novamente.</p>
          </div>
        )}

        <div className="mt-4 space-y-3 sm:hidden">
          {filteredRecords.map((record) => (
            <article className="rounded-2xl border border-ink/10 bg-cream/30 p-4" key={record.id}>
              <div className="flex items-start justify-between gap-3">
                <div><strong className="block text-ink">{record.plate}</strong><span className="text-xs text-ink/60">{record.type}</span></div>
                <StatusBadge label={record.exitAt ? 'Concluído' : 'Em aberto'} tone={record.exitAt ? 'success' : 'warning'} />
              </div>
              <p className="mt-3 text-sm font-medium text-ink/75">{record.driver}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/8 pt-3 text-xs">
                <div><dt className="font-bold uppercase tracking-wider text-ink/50">Destino</dt><dd className="mt-1 text-ink/75">{record.destination}</dd></div>
                <div><dt className="font-bold uppercase tracking-wider text-ink/50">Entrada</dt><dd className="mt-1 text-ink/75">{dateFormatter.format(new Date(record.entryAt))}</dd></div>
              </dl>
            </article>
          ))}
        </div>

        <div className="mt-3 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[50rem] border-collapse text-left text-sm">
            <caption className="sr-only">Histórico fictício de acessos</caption>
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/55">
                <th className="px-3 py-3" scope="col">Veículo</th>
                <th className="px-3 py-3" scope="col">Condutor</th>
                <th className="px-3 py-3" scope="col">Destino</th>
                <th className="px-3 py-3" scope="col">Entrada</th>
                <th className="px-3 py-3" scope="col">Saída</th>
                <th className="px-3 py-3" scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr className="border-b border-ink/6 last:border-0" key={record.id}>
                  <td className="px-3 py-4"><strong>{record.plate}</strong><span className="mt-1 block text-xs text-ink/55">{record.type}</span></td>
                  <td className="px-3 py-4 text-ink/75">{record.driver}</td>
                  <td className="px-3 py-4 text-ink/75">{record.destination}</td>
                  <td className="px-3 py-4 text-ink/75">{dateFormatter.format(new Date(record.entryAt))}</td>
                  <td className="px-3 py-4 text-ink/75">{record.exitAt ? dateFormatter.format(new Date(record.exitAt)) : '—'}</td>
                  <td className="px-3 py-4"><StatusBadge label={record.exitAt ? 'Concluído' : 'Em aberto'} tone={record.exitAt ? 'success' : 'warning'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
