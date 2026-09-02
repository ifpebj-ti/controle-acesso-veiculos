import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { RestrictedDemoState } from "../components/ui/RestrictedDemoState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { institutionalVehicles, useDemo } from "../demo";

const fleetProfiles = ["porteiro", "vigilante", "transporte"];

export function FleetPage() {
  const { profile } = useDemo();

  if (!fleetProfiles.includes(profile)) {
    return (
      <RestrictedDemoState message="A frota institucional é mantida pelo Setor de Transporte e consultada por Porteiros e Vigilantes para conferência. Administração não opera este cadastro no fluxo proposto." />
    );
  }

  const canManageFleet = profile === "transporte";

  return (
    <div>
      <PageHeader
        action={
          canManageFleet ? (
            <button
              className="min-h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white opacity-65"
              disabled
              type="button"
            >
              Novo veículo — em breve
            </button>
          ) : undefined
        }
        description={
          canManageFleet
            ? "Mantenha veículos, placas e motoristas autorizados em um único cadastro institucional."
            : "Consulte a placa cadastrada antes de confirmar a movimentação; não é necessário digitá-la novamente."
        }
        eyebrow={
          canManageFleet ? "Setor de Transporte" : "Consulta operacional"
        }
        title={
          canManageFleet
            ? "Frota institucional"
            : "Conferir frota institucional"
        }
      />

      <section
        className="mt-8 grid gap-4 md:grid-cols-3"
        aria-label="Resumo da frota fictícia"
      >
        {[
          ["Veículos cadastrados", "03", "car"],
          ["Motoristas autorizados", "05", "users"],
          ["Viagens em andamento", "01", "bus"],
        ].map(([label, value, icon]) => (
          <article
            className="rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_8px_24px_rgba(1,36,40,0.04)]"
            key={label}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink/65">{label}</p>
              <span className="grid size-10 place-items-center rounded-xl bg-brand-soft/60 text-ink">
                <Icon name={icon as "car" | "users" | "bus"} />
              </span>
            </div>
            <p className="mt-4 font-display text-4xl text-brand-dark">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(1,36,40,0.05)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Amostra
            </p>
            <h2 className="mt-1 font-display text-2xl">
              Veículos institucionais
            </h2>
          </div>
          <p className="text-xs font-semibold text-ink/55">
            Placas fictícias já armazenadas
          </p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {institutionalVehicles.map((vehicle) => (
            <article
              className="rounded-2xl border border-ink/10 bg-cream/35 p-5"
              key={vehicle.code}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft/70 text-ink">
                  <Icon name="car" />
                </span>
                <StatusBadge
                  label={vehicle.status}
                  tone={
                    vehicle.status === "Disponível"
                      ? "success"
                      : vehicle.status === "Manutenção"
                        ? "warning"
                        : "neutral"
                  }
                />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-ink/50">
                {vehicle.code}
              </p>
              <h3 className="mt-1 font-bold text-ink">{vehicle.label}</h3>
              <div className="mt-4 rounded-xl border border-brand-dark/10 bg-white p-3">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-ink/45">
                  Placa cadastrada
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-ink">
                  {vehicle.plate}
                </p>
              </div>
              {!canManageFleet && (
                <p className="mt-3 text-xs font-semibold text-brand-dark">
                  Somente conferência na portaria
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
