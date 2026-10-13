import { Link } from "react-router-dom";

import { Icon } from "./Icon";
import { Card } from "./Card";

interface AccessDeniedStateProps {
  message?: string;
}

export function AccessDeniedState({
  message = "Seu perfil não possui permissão para acessar esta área.",
}: AccessDeniedStateProps) {
  return (
    <Card
      aria-labelledby="access-denied-title"
      className="mx-auto my-6 max-w-2xl text-center"
      role="alert"
    >
      <span className="mx-auto grid size-14 place-items-center rounded-xl bg-warning-surface text-warning-text">
        <Icon name="shield" size={27} />
      </span>
      <h1
        className="mt-5 text-3xl font-bold text-text"
        id="access-denied-title"
      >
        Acesso negado
      </h1>
      <p className="mt-3 leading-7 text-ink-soft">{message}</p>
      <p className="mt-2 text-sm text-ink-soft">
        O menu organiza a experiência, mas cada operação continua sendo validada
        pela API.
      </p>
      <Link className="ui-button ui-button--primary mt-6" to="/visao-geral">
        Voltar à visão geral
      </Link>
    </Card>
  );
}
