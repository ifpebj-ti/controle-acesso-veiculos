import { Link } from 'react-router-dom';

import { Brand } from '../components/ui/Brand';

export function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-cream px-4 py-10 text-center text-ink">
      <div className="max-w-lg">
        <Brand className="mx-auto w-fit max-w-xs" />
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">Erro 404</p>
        <h1 className="mt-2 font-display text-4xl">Página não encontrada</h1>
        <p className="mt-3 leading-7 text-ink/65">O endereço informado não faz parte dos fluxos disponíveis neste protótipo.</p>
        <Link className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-ink px-6 font-bold text-white focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/35" to="/visao-geral">Voltar à visão geral</Link>
      </div>
    </main>
  );
}
