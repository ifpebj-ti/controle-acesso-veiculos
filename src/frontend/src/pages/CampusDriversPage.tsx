import { useState } from "react";
import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { useConfirmation } from "../components/ui/confirmationContext";
import { useAuthenticatedSession } from "../features/authentication";
import { PreregistrationView } from "../features/person-preregistration/components/PreregistrationView";
import { AddCampusVehicleForm } from "../features/person-preregistration/components/AddCampusVehicleForm";
import { useCampusDriverRegistry } from "../features/person-preregistration/hooks/useCampusDriverRegistry";
import type { CampusDriver } from "../features/person-preregistration/schemas/campusDriverSchemas";
import { canProfileAccessRoute } from "../routes/routeMetadata";

function CampusDriversWorkspace({ scope }: { scope: string }) {
  const registry = useCampusDriverRegistry(scope),
    confirm = useConfirmation();
  const [target, setTarget] = useState<{
    person: CampusDriver;
    trigger: HTMLElement | null;
  } | null>(null);
  async function deactivate(person: CampusDriver) {
    if (registry.pending || registry.uncertain) return;
    const accepted = await confirm({
      title: "Desativar pré-cadastro?",
      description: `${person.name} deixará de aparecer nas sugestões, incluindo seus veículos vinculados. Isso não desativa conta de login e preserva os registros históricos.`,
      confirmLabel: "Desativar pré-cadastro",
      tone: "danger",
    });
    if (accepted) await registry.deactivate(person.personId);
  }
  return (
    <>
      {target && (
        <AddCampusVehicleForm
          error={registry.mutationError}
          onClose={() => setTarget(null)}
          onEdit={registry.clearFormErrors}
          onSubmit={(input) =>
            registry.addVehicle(target.person.personId, input)
          }
          pending={registry.pending}
          person={target.person}
          returnFocusTo={target.trigger}
          uncertain={registry.uncertain}
        />
      )}
      <PreregistrationView
        fieldErrors={registry.fieldErrors}
        items={registry.result?.items ?? []}
        mutationError={target ? null : registry.mutationError}
        notice={registry.notice}
        onAddVehicle={(person) => {
          registry.clearFormErrors();
          setTarget({ person, trigger: document.activeElement as HTMLElement });
        }}
        onCreate={registry.register}
        onDeactivate={(person) => {
          void deactivate(person);
        }}
        onEdit={registry.clearFormErrors}
        onPageChange={registry.goToPage}
        onRetry={registry.refresh}
        onSearch={(filters) =>
          registry.search(filters.query, filters.includeInactive)
        }
        page={registry.filters.page}
        pending={registry.pending || Boolean(target)}
        possibleDuplicate={registry.possibleDuplicate}
        readError={registry.readError}
        status={registry.status}
        totalCount={registry.result?.totalCount ?? 0}
        uncertain={registry.uncertain}
      />
    </>
  );
}
export function CampusDriversPage() {
  const { user } = useAuthenticatedSession();
  if (!canProfileAccessRoute(user.profileName, "/condutores-vinculados"))
    return <AccessDeniedState />;
  return (
    <CampusDriversWorkspace
      key={`${user.id}:${user.profileName}`}
      scope={`${user.id}:${user.profileName}`}
    />
  );
}
