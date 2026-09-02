import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { RestrictedDemoState } from "../components/ui/RestrictedDemoState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useDemo } from "../demo";
import { useAuthenticatedSession } from "../features/authentication";

const operationalProfiles = ["Porteiro", "Vigilante", "Administrador"];
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function OpenAccessPage() {
  const { clearNotice, closeAccess, notice, records } = useDemo();
  const { user } = useAuthenticatedSession();
  const [query, setQuery] = useState("");

  const openRecords = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase("pt-BR");

    return records
      .filter(
        (record) =>
          !record.exitAt &&
          [record.plate, record.driver, record.category, record.objective].some(
            (value) =>
              value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
          ),
      )
      .sort(
        (first, second) =>
          new Date(first.entryAt).getTime() -
          new Date(second.entryAt).getTime(),
      );
  }, [query, records]);

  const representedCategories = new Set(
    openRecords.map((record) => record.category),
  ).size;

  if (!operationalProfiles.includes(user.profileName)) {
    return (
      <RestrictedDemoState message="Seu perfil não possui permissão para operar acessos em aberto." />
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
        action={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
            to="/acessos/novo"
          >
            <Icon name="plus" size={18} />
            Nova entrada
          </Link>
        }
        description="Localize veículos que ainda não registraram saída e encerre o acesso após a conferência manual."
        eyebrow="Operação da portaria"
        title="Acessos em aberto"
      />

      {notice && (
        <div
          className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          role="status"
        >
          <p>{notice}</p>
          <button
            className="shrink-0 rounded-md font-bold underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            onClick={clearNotice}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      <section
        aria-label="Resumo dos acessos abertos"
        className="mt-6 grid gap-3 sm:grid-cols-3"
      >
        {[
          ["Total em aberto", openRecords.length, "bg-[#BDD8F1]/45"],
          ["Categorias", representedCategories, "bg-[#C8CE72]/30"],
          ["Resultados da busca", openRecords.length, "bg-[#B8C9A4]/45"],
        ].map(([label, value, surface]) => (
          <article
            className={`rounded-2xl border border-ink/8 p-4 ${surface}`}
            key={label}
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/55">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl text-ink">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_12px_35px_rgba(1,36,40,0.05)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-xl">
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="open-search"
            >
              Buscar acesso aberto
            </label>
            <div className="relative mt-2">
              <Icon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50"
                name="search"
              />
              <input
                className="min-h-12 w-full rounded-xl border border-ink/20 bg-cream/45 pl-12 pr-4 text-ink outline-none placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20"
                id="open-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Placa, condutor, categoria ou objetivo"
                type="search"
                value={query}
              />
            </div>
          </div>
          <p aria-live="polite" className="text-sm font-semibold text-ink/60">
            {openRecords.length} registro(s)
          </p>
        </div>

        {openRecords.length === 0 ? (
          <div className="my-10 rounded-2xl border border-dashed border-ink/20 bg-cream/35 p-8 text-center">
            <p className="font-bold text-ink">
              Nenhum acesso aberto encontrado
            </p>
            <p className="mt-1 text-sm text-ink/60">
              Limpe a busca ou registre uma nova entrada.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {openRecords.map((record) => (
              <article
                className="rounded-2xl border border-ink/10 bg-cream/25 p-5"
                key={record.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl text-ink">
                      {record.plate}
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink/70">
                      {record.driver}
                    </p>
                  </div>
                  <StatusBadge label="Em aberto" tone="warning" />
                </div>

                <p className="mt-4 rounded-xl bg-white/75 px-3 py-2 text-sm font-semibold text-ink/75">
                  {record.objective}
                </p>

                <dl className="mt-4 grid gap-4 border-t border-ink/10 pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      Categoria
                    </dt>
                    <dd className="mt-1 text-ink/75">{record.category}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      Entrada
                    </dt>
                    <dd className="mt-1 text-ink/75">
                      {dateFormatter.format(new Date(record.entryAt))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      Tipo do veículo
                    </dt>
                    <dd className="mt-1 text-ink/75">
                      {record.vehicleType ?? "Não informado"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      Observação
                    </dt>
                    <dd className="mt-1 text-ink/75">
                      {record.observation ?? "Sem observação"}
                    </dd>
                  </div>
                </dl>

                <button
                  className="mt-5 min-h-11 w-full rounded-xl bg-ink px-4 font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/35"
                  onClick={() => confirmExit(record.id, record.plate)}
                  type="button"
                >
                  Registrar saída
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
