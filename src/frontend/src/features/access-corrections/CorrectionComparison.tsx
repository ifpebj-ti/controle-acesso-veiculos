import type { CorrectionValues } from "./schemas";

export function CorrectionComparison({
  original,
  proposed,
}: {
  original: CorrectionValues;
  proposed: CorrectionValues;
}) {
  return (
    <div className="my-4 grid gap-3 text-sm sm:grid-cols-2">
      {(
        [
          ["Original", original],
          ["Proposto", proposed],
        ] as const
      ).map(([label, values]) => (
        <section
          key={label}
          aria-label={label}
          className="min-w-0 rounded-xl border border-border bg-surface-subtle p-4 [overflow-wrap:anywhere]"
        >
          <h3 className="font-bold text-text">{label}</h3>
          <dl className="mt-3 space-y-2 text-text">
            <div>
              <dt className="font-semibold">Categoria</dt>
              <dd>{values.categoryName}</dd>
            </div>
            <div>
              <dt className="font-semibold">Objetivo</dt>
              <dd className="whitespace-pre-wrap">{values.objective}</dd>
            </div>
            <div>
              <dt className="font-semibold">Observação</dt>
              <dd className="whitespace-pre-wrap">
                {values.observation || "Não informada"}
              </dd>
            </div>
          </dl>
        </section>
      ))}
    </div>
  );
}
