import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="not-found-title"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
        Erro 404
      </p>

      <h2
        id="not-found-title"
        className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl"
      >
        Página não encontrada
      </h2>

      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        A rota informada não existe na versão atual do frontend.
      </p>

      <Link
        className="mt-6 inline-flex rounded-md bg-cyan-800 px-4 py-3 font-semibold text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        to="/"
      >
        Voltar para a página inicial
      </Link>
    </section>
  );
}