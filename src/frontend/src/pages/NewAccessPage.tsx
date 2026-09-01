import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../components/ui/PageHeader';
import { RestrictedDemoState } from '../components/ui/RestrictedDemoState';
import { useDemo } from '../demo';

const operationalProfiles = ['porteiro', 'vigilante', 'administrador'];

export function NewAccessPage() {
  const navigate = useNavigate();
  const { profile, registerAccess } = useDemo();

  if (!operationalProfiles.includes(profile)) {
    return (
      <RestrictedDemoState message="O Setor de Transporte consulta a circulação e mantém a frota. O registro operacional de entrada geral é previsto para Portaria, Vigilância e Administração." />
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    registerAccess({
      destination: String(data.get('destination')),
      driver: String(data.get('driver')),
      plate: String(data.get('plate')),
      type: String(data.get('type')) as 'Visitante' | 'Serviço' | 'Institucional',
    });
    navigate('/acessos/abertos');
  }

  const fieldClass =
    'mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20';

  return (
    <div>
      <PageHeader
        description="Primeira etapa do fluxo operacional proposto. Nesta versão, o envio altera apenas os dados temporários do navegador."
        eyebrow="Controle de acesso"
        title="Registrar entrada"
      />

      <form
        className="mt-8 grid gap-6 xl:grid-cols-[1fr_20rem]"
        onSubmit={handleSubmit}
      >
        <section className="rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(1,36,40,0.05)] sm:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-ink" htmlFor="plate">
                Placa do veículo <span aria-hidden="true" className="text-red-700">*</span>
              </label>
              <input
                autoCapitalize="characters"
                className={fieldClass}
                id="plate"
                maxLength={8}
                name="plate"
                placeholder="Ex.: DEM-1234"
                required
              />
              <p className="mt-1.5 text-xs text-ink/55">Use um dado fictício nesta demonstração.</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink" htmlFor="type">
                Tipo de acesso <span aria-hidden="true" className="text-red-700">*</span>
              </label>
              <select className={fieldClass} defaultValue="Visitante" id="type" name="type" required>
                <option>Visitante</option>
                <option>Serviço</option>
                <option>Institucional</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-ink" htmlFor="driver">
                Identificação do condutor <span aria-hidden="true" className="text-red-700">*</span>
              </label>
              <input
                autoComplete="off"
                className={fieldClass}
                id="driver"
                name="driver"
                placeholder="Ex.: Pessoa de demonstração 03"
                required
              />
              <p className="mt-1.5 text-xs text-ink/55">O dado definitivo ainda será validado com Portaria e Vigilância.</p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-ink" htmlFor="destination">
                Destino no campus <span aria-hidden="true" className="text-red-700">*</span>
              </label>
              <input
                autoComplete="off"
                className={fieldClass}
                id="destination"
                name="destination"
                placeholder="Ex.: Setor administrativo"
                required
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:justify-end">
            <button
              className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
              onClick={() => navigate('/visao-geral')}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="min-h-12 rounded-xl bg-brand px-6 font-bold text-white shadow-sm hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
              type="submit"
            >
              Simular entrada
            </button>
          </div>
        </section>

        <aside className="h-fit rounded-3xl bg-brand-soft/65 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">Antes de continuar</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Conferência rápida</h2>
          <ol className="mt-5 space-y-4 text-sm leading-6 text-ink/75">
            <li><strong className="text-ink">1.</strong> Confirme a placa com o veículo.</li>
            <li><strong className="text-ink">2.</strong> Verifique a identificação conforme procedimento institucional.</li>
            <li><strong className="text-ink">3.</strong> Informe o destino para apoiar a portaria.</li>
          </ol>
          <p className="mt-6 rounded-xl border border-brand-dark/15 bg-cream/60 p-3 text-xs leading-5 text-ink/70">
            Pergunta para validação: quais documentos realmente precisam ser conferidos e quais dados podem ser registrados?
          </p>
        </aside>
      </form>
    </div>
  );
}
