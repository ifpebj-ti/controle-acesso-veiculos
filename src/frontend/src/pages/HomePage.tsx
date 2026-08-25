export function HomePage() {
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="home-title"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
        Página inicial
      </p>

      <h2
        id="home-title"
        className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl"
      >
        Estrutura inicial configurada
      </h2>

      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        O frontend está preparado para receber as funcionalidades do sistema
        de controle de acesso de veículos.
      </p>

      <div
        className="mt-6 flex flex-wrap gap-2 rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-cyan-900"
        role="status"
      >
        <strong>Próximos módulos:</strong>
        <span>cadastros, registros de entrada e saída e consultas.</span>
      </div>
    </section>
  );
}