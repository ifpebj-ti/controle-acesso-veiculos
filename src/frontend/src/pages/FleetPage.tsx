import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { RestrictedDemoState } from '../components/ui/RestrictedDemoState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useDemo } from '../demo';

const vehicles = [
  { code: 'IFPE-01', label: 'Ônibus institucional', plate: 'IFD-0101', status: 'Disponível' },
  { code: 'IFPE-02', label: 'Van institucional', plate: 'IFD-0202', status: 'Em viagem' },
  { code: 'IFPE-03', label: 'Veículo de apoio', plate: 'IFD-0303', status: 'Manutenção' },
];

export function FleetPage() {
  const { profile } = useDemo();

  if (!['transporte', 'administrador'].includes(profile)) {
    return <RestrictedDemoState message="O catálogo e a manutenção da frota institucional são previstos para o Setor de Transporte e Administração." />;
  }

  return (
    <div>
      <PageHeader
        action={<button className="min-h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white opacity-65" disabled type="button">Novo veículo — em breve</button>}
        description="Visão inicial para discutir cadastro, disponibilidade, motoristas e usos da frota com o Setor de Transporte."
        eyebrow="Setor de Transporte"
        title="Frota institucional"
      />

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Resumo da frota fictícia">
        {[
          ['Veículos cadastrados', '03', 'car'],
          ['Motoristas autorizados', '05', 'users'],
          ['Viagens em andamento', '01', 'bus'],
        ].map(([label, value, icon]) => (
          <article className="rounded-2xl border border-ink/10 bg-white p-5" key={label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink/65">{label}</p>
              <span className="grid size-10 place-items-center rounded-xl bg-brand-soft/60 text-ink"><Icon name={icon as 'car' | 'users' | 'bus'} /></span>
            </div>
            <p className="mt-4 font-display text-4xl text-brand-dark">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(1,36,40,0.05)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">Amostra</p><h2 className="mt-1 font-display text-2xl">Veículos institucionais</h2></div>
          <p className="text-xs font-semibold text-ink/55">Dados inteiramente fictícios</p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <article className="rounded-2xl border border-ink/10 bg-cream/35 p-5" key={vehicle.code}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft/70 text-ink"><Icon name="car" /></span>
                <StatusBadge label={vehicle.status} tone={vehicle.status === 'Disponível' ? 'success' : vehicle.status === 'Manutenção' ? 'warning' : 'neutral'} />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-ink/50">{vehicle.code}</p>
              <h3 className="mt-1 font-bold text-ink">{vehicle.label}</h3>
              <p className="mt-2 font-mono text-sm text-ink/70">{vehicle.plate}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
