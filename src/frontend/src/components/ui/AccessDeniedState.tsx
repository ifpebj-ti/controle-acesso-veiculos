import { Link } from "react-router-dom";

import { Icon } from "./Icon";

interface AccessDeniedStateProps {
  message?: string;
}

export function AccessDeniedState({
  message = "Seu perfil não possui permissão para acessar esta área.",
}: AccessDeniedStateProps) {
  return (
    <section
      aria-labelledby="access-denied-title"
      className="mx-auto mt-16 max-w-2xl rounded-3xl border border-amber-300/70 bg-white p-8 text-center shadow-[0_12px_36px_rgba(1,36,40,0.06)]"
      role="alert"
    >
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-950">
        <Icon name="shield" size={27} />
      </span>
      <h1
        className="mt-5 font-display text-3xl text-ink"
        id="access-denied-title"
      >
        Acesso negado
      </h1>
      <p className="mt-3 leading-7 text-ink/70">{message}</p>
      <p className="mt-2 text-sm text-ink/55">
        O menu organiza a experiência, mas cada operação continua sendo validada
        pela API.
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
