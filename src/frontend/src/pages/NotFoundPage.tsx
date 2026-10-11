import { Link } from "react-router-dom";

import { Brand } from "../components/ui/Brand";
import { Card } from "../components/ui/Card";

export function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-4 py-10 text-center text-text">
      <Card className="w-full max-w-lg">
        <Brand className="mx-auto w-fit max-w-xs" />
        <p className="mt-8 text-sm font-semibold text-text-muted">Erro 404</p>
        <h1 className="mt-3 text-3xl font-bold">Página não encontrada</h1>
        <p className="mt-3 leading-7 text-ink-soft">
          O endereço informado não faz parte das páginas disponíveis no sistema.
        </p>
        <Link className="ui-button ui-button--primary mt-6" to="/visao-geral">
          Voltar à visão geral
        </Link>
      </Card>
    </main>
  );
}
