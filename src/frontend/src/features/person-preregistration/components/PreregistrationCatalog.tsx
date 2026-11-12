import { Button } from "../../../components/ui/Button";
import { ContentState } from "../../../components/ui/ContentState";
import { Icon } from "../../../components/ui/Icon";
import type {
  PreregistrationCatalogStatus,
  PreregistrationListItem,
} from "../model/preregistrationPresentation";

interface PreregistrationCatalogProps {
  items: readonly PreregistrationListItem[];
  onRetry: () => void;
  status: PreregistrationCatalogStatus;
}

export function PreregistrationCatalog({
  items,
  onRetry,
  status,
}: PreregistrationCatalogProps) {
  if (status === "loading")
    return <ContentState title="Consultando pré-cadastros" variant="loading" />;
  if (status === "error")
    return (
      <ContentState
        action={
          <Button onClick={onRetry} variant="secondary">
            Tentar novamente
          </Button>
        }
        description="Não foi possível consultar os pré-cadastros. Tente novamente."
        title="Consulta indisponível"
        variant="error"
      />
    );
  if (status === "denied")
    return (
      <ContentState
        description="Você não tem permissão para consultar esta área."
        title="Acesso não permitido"
        variant="error"
      />
    );
  if (!items.length)
    return (
      <ContentState
        description="Revise os filtros ou faça um novo pré-cadastro."
        icon="users"
        title="Nenhuma pessoa encontrada"
        variant="empty"
      />
    );
  return (
    <div>
      <p className="mb-4 text-sm text-text-muted" role="status">
        {items.length} registro(s) exibido(s).
      </p>
      <ul aria-label="Pessoas pré-cadastradas" className="grid gap-3">
        {items.map((person) => (
          <li
            className="flex min-w-0 flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
            key={person.key}
          >
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-subtle text-primary"
            >
              <Icon name="user" />
            </span>
            <div className="min-w-0 flex-1 break-words">
              <h3 className="font-semibold text-text">{person.name}</h3>
              <p className="mt-1 text-sm text-text-muted">
                <span className="sr-only">Classificação: </span>
                {person.classification}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
