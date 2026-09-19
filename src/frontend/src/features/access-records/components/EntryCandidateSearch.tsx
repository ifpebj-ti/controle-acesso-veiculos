import { useEffect, useId, useRef, useState } from "react";

import { searchAccessEntryCandidates } from "../services/accessRecordsService";
import type { AccessEntryCandidate } from "../types";

type SearchStatus = "idle" | "loading" | "ready" | "empty" | "error";

interface EntryCandidateSearchProps {
  onClear: () => void;
  onSelect: (candidate: AccessEntryCandidate) => void;
  selectedCandidate: AccessEntryCandidate | null;
}

const debounceMilliseconds = 350;

function describeVehicle(candidate: AccessEntryCandidate) {
  const details = [
    candidate.vehicleType,
    candidate.brand,
    candidate.model,
    candidate.color,
  ].filter((value): value is string => Boolean(value?.trim()));
  return details.length > 0
    ? details.join(" · ")
    : "Detalhes do veículo não informados";
}

export function EntryCandidateSearch({
  onClear,
  onSelect,
  selectedCandidate,
}: EntryCandidateSearchProps) {
  const generatedId = useId().replaceAll(":", "");
  const inputId = `entry-candidate-search-${generatedId}`;
  const listId = `entry-candidate-results-${generatedId}`;
  const guidanceId = `entry-candidate-guidance-${generatedId}`;
  const statusId = `entry-candidate-status-${generatedId}`;
  const requestId = useRef(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AccessEntryCandidate[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (normalizedQuery.length < 3) {
      return;
    }

    const currentRequest = ++requestId.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      setResults([]);
      setActiveIndex(-1);

      try {
        const candidates = await searchAccessEntryCandidates(
          normalizedQuery,
          controller.signal,
        );
        if (requestId.current !== currentRequest) return;
        setResults(candidates);
        setStatus(candidates.length > 0 ? "ready" : "empty");
        setOpen(true);
      } catch {
        if (controller.signal.aborted || requestId.current !== currentRequest) {
          return;
        }
        setResults([]);
        setStatus("error");
        setOpen(true);
      }
    }, debounceMilliseconds);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedQuery]);

  function selectCandidate(candidate: AccessEntryCandidate) {
    onSelect(candidate);
    setQuery("");
    setResults([]);
    setStatus("idle");
    setOpen(false);
    setActiveIndex(-1);
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() =>
        document.getElementById("plate")?.focus(),
      ),
    );
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setOpen(true);
    if (value.trim().length < 3) {
      requestId.current += 1;
      setResults([]);
      setStatus("idle");
      setActiveIndex(-1);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (status === "ready" && open && activeIndex >= 0) {
        selectCandidate(results[activeIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (status !== "ready" || results.length === 0) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        if (event.key === "ArrowDown") return (current + 1) % results.length;
        return current <= 0 ? results.length - 1 : current - 1;
      });
      return;
    }
  }

  const activeOptionId =
    open && activeIndex >= 0
      ? `${listId}-option-${results[activeIndex]?.vehicleId}-${results[activeIndex]?.personId}`
      : undefined;
  const statusMessage =
    status === "loading"
      ? "Buscando veículos e condutores…"
      : status === "empty"
        ? "Nenhum resultado encontrado. Continue preenchendo manualmente."
        : status === "error"
          ? ""
          : status === "ready"
            ? `${results.length} ${results.length === 1 ? "resultado encontrado" : "resultados encontrados"}.`
            : normalizedQuery.length > 0 && normalizedQuery.length < 3
              ? "Digite pelo menos 3 caracteres para buscar."
              : "";

  return (
    <section
      aria-labelledby={`${inputId}-title`}
      className="rounded-2xl border border-ink/10 bg-cream/35 p-4 sm:p-5"
    >
      <h3 className="font-display text-xl text-ink" id={`${inputId}-title`}>
        Buscar cadastro anterior
      </h3>
      <p className="mt-1 text-sm leading-6 text-ink-soft" id={guidanceId}>
        Digite ao menos 3 caracteres da placa ou do nome. Se não encontrar,
        preencha os campos normalmente.
      </p>
      <label className="sr-only" htmlFor={inputId}>
        Buscar por placa ou nome do condutor
      </label>
      <div className="relative mt-3">
        <input
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-describedby={`${guidanceId} ${statusId}`}
          aria-expanded={open && status === "ready"}
          autoFocus
          autoComplete="off"
          className="min-h-12 w-full rounded-xl border border-ink/20 bg-white px-4 text-ink outline-none transition placeholder:text-ink-soft focus:border-brand-dark focus:ring-3 focus:ring-brand/20"
          id={inputId}
          maxLength={80}
          onBlur={() => setOpen(false)}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Ex.: DEM-1A23 ou Pessoa de demonstração"
          role="combobox"
          type="search"
          value={query}
        />

        {open && status === "ready" && (
          <ul
            className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-ink/15 bg-white p-2 shadow-xl"
            id={listId}
            role="listbox"
          >
            {results.map((candidate, index) => {
              const optionId = `${listId}-option-${candidate.vehicleId}-${candidate.personId}`;
              return (
                <li
                  aria-selected={activeIndex === index}
                  className={`cursor-pointer rounded-xl px-3 py-3 text-left outline-none transition ${
                    activeIndex === index ? "bg-brand/10" : "hover:bg-cream"
                  }`}
                  id={optionId}
                  key={`${candidate.vehicleId}-${candidate.personId}`}
                  onClick={() => selectCandidate(candidate)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  role="option"
                >
                  <span className="flex flex-wrap items-baseline gap-x-2 text-ink">
                    <strong>{candidate.plate}</strong>
                    <span>{candidate.driverName}</span>
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {describeVehicle(candidate)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p aria-live="polite" className="sr-only" id={statusId} role="status">
        {statusMessage}
      </p>

      <p aria-atomic="true" aria-live="assertive" className="sr-only">
        {selectedCandidate && (
          <>
            {selectedCandidate.plate} e {selectedCandidate.driverName}{" "}
            selecionados para conferência. Atenção: os dados recuperados não
            autorizam automaticamente a entrada.
          </>
        )}
      </p>

      {status === "empty" && (
        <p className="mt-3 text-sm text-ink-soft">{statusMessage}</p>
      )}
      {status === "error" && (
        <div
          className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
          role="alert"
        >
          Não foi possível realizar a busca. Continue preenchendo manualmente ou
          tente outra vez.
        </div>
      )}

      {selectedCandidate && (
        <div className="mt-4 rounded-xl border border-brand-dark/25 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold text-ink">
                {selectedCandidate.plate} · {selectedCandidate.driverName}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Dados recuperados para conferência. A seleção não autoriza a
                entrada automaticamente.
              </p>
            </div>
            <button
              className="min-h-10 rounded-xl border border-ink/20 px-4 text-sm font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
              onClick={onClear}
              type="button"
            >
              Usar preenchimento manual
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
