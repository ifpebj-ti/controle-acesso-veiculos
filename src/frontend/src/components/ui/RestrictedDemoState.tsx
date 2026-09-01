import { Link } from 'react-router-dom';

import { Icon } from './Icon';

interface RestrictedDemoStateProps {
  message: string;
}

export function RestrictedDemoState({ message }: RestrictedDemoStateProps) {
  return (
    <section className="mx-auto mt-16 max-w-2xl rounded-3xl border border-ink/10 bg-white p-8 text-center shadow-[0_12px_36px_rgba(1,36,40,0.06)]">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft/65 text-ink">
        <Icon name="shield" size={27} />
      </span>
      <h1 className="mt-5 font-display text-3xl text-ink">Fora das atribuições deste perfil</h1>
      <p className="mt-3 leading-7 text-ink/70">{message}</p>
      <p className="mt-2 text-sm text-ink/55">
        No protótipo, você pode trocar o perfil no menu lateral para comparar a navegação.
      </p>
      <Link
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-ink px-5 font-bold text-white focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/40"
        to="/visao-geral"
      >
        Voltar à visão geral
      </Link>
    </section>
  );
}
