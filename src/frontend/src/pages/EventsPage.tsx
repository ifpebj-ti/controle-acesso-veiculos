import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { RestrictedDemoState } from "../components/ui/RestrictedDemoState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuthenticatedSession } from "../features/authentication";

const events = [
  {
    date: "03 SET",
    name: "Atividade acadêmica demonstrativa",
    expected: 12,
    status: "Confirmado",
  },
  {
    date: "08 SET",
    name: "Manutenção programada demonstrativa",
    expected: 4,
    status: "Em revisão",
  },
];

export function EventsPage() {
  const { user } = useAuthenticatedSession();
  const profile = user.profileName;

  if (
    !["Porteiro", "Vigilante", "SetorTransporte", "Administrador"].includes(
      profile,
    )
  ) {
    return (
      <RestrictedDemoState message="Autorizações de eventos são mantidas pelo Setor de Transporte e consultadas por Porteiros e Vigilantes durante a operação." />
    );
  }

  const canManageEvents =
    profile === "SetorTransporte" || profile === "Administrador";

  return (
    <div>
      <PageHeader
        action={
          canManageEvents ? (
            <button
              className="min-h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white opacity-65"
              disabled
              type="button"
            >
              Nova autorização — em breve
            </button>
          ) : undefined
        }
        description={
          canManageEvents
            ? "Cadastre autorizações antecipadas para reduzir conferências repetidas na portaria."
            : "Confira eventos e veículos previstos; a autorização não substitui o registro de entrada."
        }
        eyebrow={canManageEvents ? "Planejamento" : "Consulta operacional"}
        title={
          canManageEvents ? "Eventos e autorizações" : "Conferir autorizações"
        }
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(1,36,40,0.05)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl">Próximos eventos</h2>
            <span className="text-sm font-semibold text-ink/55">
              2 na amostra
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {events.map((event) => (
              <article
                className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-cream/30 p-4 sm:flex-row sm:items-center"
                key={event.name}
              >
                <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft text-center text-xs font-extrabold tracking-wider text-ink">
                  {event.date}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-ink">{event.name}</h3>
                  <p className="mt-1 text-sm text-ink/60">
                    {event.expected} veículos previstos
                  </p>
                </div>
                <StatusBadge
                  label={event.status}
                  tone={event.status === "Confirmado" ? "success" : "warning"}
                />
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl bg-brand-soft/65 p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-cream text-ink">
            <Icon name="calendar" />
          </span>
          <h2 className="mt-5 font-display text-2xl">Como usar</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            {canManageEvents
              ? "O Setor de Transporte prepara as autorizações e mantém período, responsável, área e regras de veículos."
              : "Porteiros e Vigilantes apenas conferem se o evento está vigente e se o veículo está previsto."}
          </p>
          <p className="mt-4 rounded-xl bg-cream/70 p-3 text-xs leading-5 text-ink/65">
            “Previsto”, “autorizado” e “entrada realizada” continuam sendo
            estados diferentes.
          </p>
        </aside>
      </div>
    </div>
  );
}
