import { Button } from "../../../components/ui/Button";
import { ContentState } from "../../../components/ui/ContentState";
import { Icon } from "../../../components/ui/Icon";
import {
  affiliationLabel,
  type PreregistrationCatalogStatus,
  type PreregistrationListItem,
} from "../model/preregistrationPresentation";
interface Props {
  items: readonly PreregistrationListItem[];
  onRetry: () => void;
  status: PreregistrationCatalogStatus;
  errorMessage?: string | null;
  onAddVehicle?: (person: PreregistrationListItem) => void;
  onDeactivate?: (person: PreregistrationListItem) => void;
  locked?: boolean;
}
export function PreregistrationCatalog({
  items,
  onRetry,
  status,
  errorMessage,
  onAddVehicle,
  onDeactivate,
  locked,
}: Props) {
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
        description={
          errorMessage ??
          "Não foi possível consultar os pré-cadastros. Tente novamente."
        }
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
    <>
      <p className="mb-4 text-sm text-text-muted" role="status">
        {items.length} vínculo(s) exibido(s). Cada linha corresponde a uma
        pessoa e um veículo.
      </p>
      <ul aria-label="Condutores pré-cadastrados" className="grid gap-3">
        {items.map((person) => (
          <li
            className="flex min-w-0 flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
            key={`${person.personId}:${person.vehicleId}`}
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
                {affiliationLabel(person.affiliation)} ·{" "}
                {person.active ? "Ativo" : "Inativo"}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {person.plate} · {person.vehicleType ?? "Tipo não informado"}
              </p>
            </div>
            {person.active && (
              <div className="flex flex-wrap gap-2">
                {onAddVehicle && (
                  <Button
                    aria-label={`Vincular outro veículo a ${person.name}, placa ${person.plate}`}
                    disabled={locked}
                    onClick={() => onAddVehicle(person)}
                    variant="secondary"
                  >
                    Vincular outro veículo
                  </Button>
                )}
                {onDeactivate && (
                  <Button
                    aria-label={`Desativar pré-cadastro de ${person.name}, placa ${person.plate}`}
                    disabled={locked}
                    onClick={() => onDeactivate(person)}
                    variant="secondary"
                  >
                    Desativar pré-cadastro
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
