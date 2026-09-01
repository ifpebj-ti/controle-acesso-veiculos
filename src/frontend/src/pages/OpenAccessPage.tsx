import { useMemo, useState } from 'react';

import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { RestrictedDemoState } from '../components/ui/RestrictedDemoState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useDemo } from '../demo';

const operationalProfiles = ['porteiro', 'vigilante', 'administrador'];
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function OpenAccessPage() {
  const { clearNotice, closeAccess, notice, profile, records } = useDemo();
  const [query, setQuery] = useState('');
  const openRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          !record.exitAt &&
          [record.plate, record.driver, record.destination].some((value) =>
            value.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')),
          ),
      ),
    [query, records],
  );

  if (!operationalProfiles.includes(profile)) {
    return (
      <RestrictedDemoState message="A baixa operacional de saída é prevista para Portaria, Vigilância e Administração. O Setor de Transporte poderá acompanhar as informações permitidas pelo histórico." />
    );
  }

  function confirmExit(id: number, plate: string) {
    if (window.confirm(`Confirmar a saída simulada do veículo ${plate}?`)) {
      closeAccess(id);
    }
  }

  return (
    <div>
      <PageHeader
        description="Localize rapidamente veículos que ainda não possuem horário de saída e conclua o registro demonstrativo."
        eyebrow="Controle de acesso"
        title="Acessos abertos"
      />

      {notice && (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
          <p>{notice}</p>
          <button className="shrink-0 rounded-md font-bold underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" onClick={clearNotice} type="button">Fechar</button>
        </div>
      )}

      <section className="mt-6 rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(1,36,40,0.05)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-xl">
            <label className="text-sm font-semibold text-ink" htmlFor="open-search">Buscar acesso aberto</label>
            <div className="relative mt-2">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50" name="search" />
              <input
                className="min-h-12 w-full rounded-xl border border-ink/20 bg-cream/45 pl-12 pr-4 text-ink outline-none placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20"
                id="open-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Placa, condutor ou destino"
                type="search"
                value={query}
              />
            </div>
          </div>
          <p className="text-sm font-semibold text-ink/60" aria-live="polite">{openRecords.length} registro(s)</p>
        </div>

        {openRecords.length === 0 ? (
          <div className="my-10 rounded-2xl border border-dashed border-ink/20 bg-cream/35 p-8 text-center">
            <p className="font-bold text-ink">Nenhum acesso aberto encontrado</p>
            <p className="mt-1 text-sm text-ink/60">Limpe a busca ou simule uma nova entrada.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {openRecords.map((record) => (
              <article className="rounded-2xl border border-ink/10 bg-cream/25 p-5" key={record.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl text-ink">{record.plate}</p>
                    <p className="mt-1 text-sm text-ink/65">{record.driver}</p>
                  </div>
                  <StatusBadge label="Em aberto" tone="warning" />
                </div>
                <dl className="mt-5 grid gap-4 border-t border-ink/10 pt-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-ink/50">Destino</dt><dd className="mt-1 text-ink/75">{record.destination}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-ink/50">Entrada</dt><dd className="mt-1 text-ink/75">{dateFormatter.format(new Date(record.entryAt))}</dd></div>
                </dl>
                <button
                  className="mt-5 min-h-11 w-full rounded-xl bg-ink px-4 font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/35"
                  onClick={() => confirmExit(record.id, record.plate)}
                  type="button"
                >
                  Simular registro de saída
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
