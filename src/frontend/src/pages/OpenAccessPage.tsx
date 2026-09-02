import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { RestrictedDemoState } from "../components/ui/RestrictedDemoState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useDemo, type DemoAccessRecord } from "../demo";
import { useAuthenticatedSession } from "../features/authentication";

const operationalProfiles = ["Porteiro", "Vigilante", "Administrador"];
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function isOverdue(record: DemoAccessRecord, now: Date) {
  return Boolean(
    !record.exitAt &&
    record.expectedExitAt &&
    new Date(record.expectedExitAt).getTime() < now.getTime(),
  );
}

function overdueLabel(record: DemoAccessRecord, now: Date) {
  if (!record.expectedExitAt) return null;
  const difference = now.getTime() - new Date(record.expectedExitAt).getTime();
  if (difference <= 0) return null;

  const minutes = Math.max(1, Math.floor(difference / 60_000));
  if (minutes < 60) return `${minutes} min além da previsão`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes.toString().padStart(2, "0")} além da previsão`;
}

export function OpenAccessPage() {
  const { clearNotice, closeAccess, notice, records } = useDemo();
  const { user } = useAuthenticatedSession();
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const openRecords = useMemo(
    () =>
      records
        .filter(
          (record) =>
            !record.exitAt &&
            [
              record.plate,
              record.driver,
              record.destination,
              record.purpose,
            ].some((value) =>
              value
                .toLocaleLowerCase("pt-BR")
                .includes(query.toLocaleLowerCase("pt-BR")),
            ),
        )
        .sort(
          (first, second) =>
            Number(isOverdue(second, now)) - Number(isOverdue(first, now)),
        ),
    [now, query, records],
  );
  const overdueRecords = openRecords.filter((record) => isOverdue(record, now));
  const recordsWithoutAlert = openRecords.filter(
    (record) => !isOverdue(record, now),
  );

  if (!operationalProfiles.includes(user.profileName)) {
    return (
      <RestrictedDemoState message="A conferência de acessos abertos e o registro de saída são tarefas exclusivas de Porteiros e Vigilantes. Os demais perfis consultam o histórico." />
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
        description="Acompanhe quem permanece no campus, priorize previsões vencidas e registre a saída sem alterar a autoria da entrada."
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

      {overdueRecords.length > 0 && (
        <section
          aria-labelledby="overdue-title"
          className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-100 text-red-800">
              <Icon name="clock" />
            </span>
            <div>
              <h2 className="font-bold text-red-950" id="overdue-title">
                {overdueRecords.length} acesso(s) acima da previsão
              </h2>
              <p className="mt-1 text-sm leading-5 text-red-900/75">
                Confira a situação com o responsável. O sistema nunca registra a
                saída automaticamente.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-800">
            Requer atenção
          </span>
        </section>
      )}

      <section
        className="mt-6 grid gap-3 sm:grid-cols-3"
        aria-label="Resumo dos acessos abertos"
      >
        {[
          ["Total em aberto", openRecords.length, "bg-[#BDD8F1]/45"],
          ["Prazo excedido", overdueRecords.length, "bg-red-50"],
          [
            "Sem alerta de prazo",
            recordsWithoutAlert.length,
            "bg-[#C8CE72]/30",
          ],
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
                placeholder="Placa, pessoa ou destino"
                type="search"
                value={query}
              />
            </div>
          </div>
          <p className="text-sm font-semibold text-ink/60" aria-live="polite">
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
            {openRecords.map((record) => {
              const overdue = isOverdue(record, now);
              return (
                <article
                  className={`rounded-2xl border p-5 ${
                    overdue
                      ? "border-red-200 bg-red-50/70"
                      : "border-ink/10 bg-cream/25"
                  }`}
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
                    <StatusBadge
                      label={overdue ? "Prazo excedido" : "Em aberto"}
                      tone={overdue ? "danger" : "warning"}
                    />
                  </div>

                  <p className="mt-4 rounded-xl bg-white/75 px-3 py-2 text-sm font-semibold text-ink/75">
                    {record.purpose}
                  </p>

                  <dl className="mt-4 grid gap-4 border-t border-ink/10 pt-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">
                        Destino
                      </dt>
                      <dd className="mt-1 text-ink/75">{record.destination}</dd>
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
                        Previsão
                      </dt>
                      <dd className="mt-1 text-ink/75">
                        {record.expectedExitAt
                          ? timeFormatter.format(
                              new Date(record.expectedExitAt),
                            )
                          : "Não definida"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">
                        Conferência
                      </dt>
                      <dd className="mt-1 text-ink/75">
                        {record.documentVerified
                          ? "Documento conferido"
                          : record.type === "Institucional"
                            ? "Placa cadastrada"
                            : "Não se aplica"}
                      </dd>
                    </div>
                  </dl>

                  {overdue && (
                    <p className="mt-4 text-sm font-bold text-red-800">
                      {overdueLabel(record, now)}
                    </p>
                  )}

                  <button
                    className="mt-5 min-h-11 w-full rounded-xl bg-ink px-4 font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/35"
                    onClick={() => confirmExit(record.id, record.plate)}
                    type="button"
                  >
                    Registrar saída
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
