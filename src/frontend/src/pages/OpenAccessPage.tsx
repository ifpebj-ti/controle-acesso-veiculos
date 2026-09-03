import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import {
  closeAccessRecord,
  listOpenAccessRecords,
  type AccessRecord,
} from "../features/access-records";
import { describeApiError } from "../services/api-errors";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

interface LocationState {
  notice?: string;
}

export function OpenAccessPage() {
  const location = useLocation();
  const [records, setRecords] = useState<AccessRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "denied"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState(
    (location.state as LocationState | null)?.notice ?? null,
  );
  const [closingId, setClosingId] = useState<number | null>(null);

  const loadRecords = useCallback(async () => {
    setStatus("loading");
    setRecords([]);
    setErrorMessage(null);

    try {
      setRecords(await listOpenAccessRecords());
      setStatus("ready");
    } catch (error) {
      const description = describeApiError(error);
      setRecords([]);
      setStatus(description.kind === "access-denied" ? "denied" : "error");
      setErrorMessage(description.message);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void listOpenAccessRecords()
      .then((response) => {
        if (!active) return;
        setRecords(response);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        const description = describeApiError(error);
        setRecords([]);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(description.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return records.filter((record) =>
      [
        record.plate,
        record.driverName,
        record.categoryName,
        record.objective,
      ].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
      ),
    );
  }, [query, records]);

  const representedCategories = new Set(
    filteredRecords.map((record) => record.categoryName),
  ).size;

  async function confirmExit(record: AccessRecord) {
    if (!window.confirm(`Confirmar a saída do veículo ${record.plate}?`))
      return;

    setClosingId(record.id);
    setErrorMessage(null);
    try {
      await closeAccessRecord(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setNotice(`Saída do veículo ${record.plate} registrada com sucesso.`);
    } catch (error) {
      const description = describeApiError(error);
      if (description.kind === "access-denied") setStatus("denied");
      setErrorMessage(description.message);
    } finally {
      setClosingId(null);
    }
  }

  if (status === "denied") {
    return <AccessDeniedState message={errorMessage ?? undefined} />;
  }

  return (
    <div>
      <PageHeader
        action={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
            to="/acessos/novo"
          >
            <Icon name="plus" size={18} /> Nova entrada
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
            onClick={() => setNotice(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      {errorMessage && status !== "loading" && (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          <p>{errorMessage}</p>
          {status === "error" && (
            <button
              className="min-h-10 rounded-xl border border-red-300 px-4 font-bold"
              onClick={() => void loadRecords()}
              type="button"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      <section
        aria-label="Resumo dos acessos abertos"
        className="mt-6 grid gap-3 sm:grid-cols-3"
      >
        {[
          ["Total em aberto", records.length, "bg-[#BDD8F1]/45"],
          ["Categorias", representedCategories, "bg-[#C8CE72]/30"],
          ["Resultados da busca", filteredRecords.length, "bg-[#B8C9A4]/45"],
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

      <section
        className="mt-6 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_12px_35px_rgba(1,36,40,0.05)] sm:p-6"
        aria-busy={status === "loading"}
      >
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
            {filteredRecords.length} registro(s)
          </p>
        </div>

        {status === "loading" ? (
          <div
            className="my-10 rounded-2xl bg-cream/35 p-8 text-center"
            role="status"
          >
            Carregando acessos em aberto…
          </div>
        ) : filteredRecords.length === 0 ? (
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
            {filteredRecords.map((record) => (
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
                      {record.driverName}
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
                    <dd className="mt-1 text-ink/75">{record.categoryName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      Entrada
                    </dt>
                    <dd className="mt-1 text-ink/75">
                      {dateFormatter.format(new Date(record.entryAtUtc))}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      Observação
                    </dt>
                    <dd className="mt-1 text-ink/75">
                      {record.observation ?? "Sem observação"}
                    </dd>
                  </div>
                </dl>
                <button
                  className="mt-5 min-h-11 w-full rounded-xl bg-ink px-4 font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/35 disabled:cursor-wait disabled:opacity-65"
                  disabled={closingId !== null}
                  onClick={() => void confirmExit(record)}
                  type="button"
                >
                  {closingId === record.id
                    ? "Registrando saída…"
                    : "Registrar saída"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
