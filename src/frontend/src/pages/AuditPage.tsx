import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { PageHeader } from "../components/ui/PageHeader";
import { AuditTrailPanel } from "../features/audit-trail";
import { useAuthenticatedSession } from "../features/authentication";
import { canProfileAccessRoute } from "../routes/routeMetadata";

export function AuditPage() {
  const { user } = useAuthenticatedSession();
  if (!canProfileAccessRoute(user.profileName, "/auditoria")) {
    return <AccessDeniedState />;
  }
  return (
    <>
      <PageHeader
        description="Consulte as ações registradas e preserve a autoria e o histórico das operações."
        eyebrow="Supervisão"
        title="Trilha de auditoria"
        variant="prominent"
      />
      <AuditTrailPanel enabled />
    </>
  );
}
