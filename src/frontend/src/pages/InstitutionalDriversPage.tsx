import { useCallback, useEffect, useMemo, useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { ActionFeedback } from "../components/ui/ActionFeedback";
import { useConfirmation } from "../components/ui/confirmationContext";
import { ContentState } from "../components/ui/ContentState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuthenticatedSession } from "../features/authentication";
import {
  authorizeInstitutionalDriver,
  deactivateInstitutionalDriver,
  InstitutionalDriverCatalog,
  InstitutionalDriverForm,
  listInstitutionalDrivers,
  type InstitutionalDriver,
  type InstitutionalDriverField,
  type InstitutionalDriverInput,
} from "../features/institutional-drivers";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";
import { profileHasCapability } from "../routes/routeMetadata";

const driverFieldNames: Record<string, InstitutionalDriverField> = {
  documentNumber: "documentNumber",
  documentType: "documentType",
  name: "name",
};

export function InstitutionalDriversPage() {
  const confirmAction = useConfirmation();
  const { user } = useAuthenticatedSession();
  const canManage = profileHasCapability(
    user.profileName,
    "manage-institutional-catalogs",
  );
  const [drivers, setDrivers] = useState<InstitutionalDriver[]>([]);
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "denied"
  >("loading");
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<InstitutionalDriverField, string>>
  >({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadDrivers = useCallback(async () => {
    setStatus("loading");
    setDrivers([]);
    setErrorMessage(null);
    setNotice(null);
    setFormError(null);
    setServerErrors({});
    try {
      setDrivers(await listInstitutionalDrivers());
      setStatus("ready");
    } catch (error) {
      const description = describeApiError(error);
      setDrivers([]);
      setStatus(description.kind === "access-denied" ? "denied" : "error");
      setErrorMessage(description.message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void listInstitutionalDrivers()
      .then((response) => {
        if (!active) return;
        setDrivers(response);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        const description = describeApiError(error);
        setDrivers([]);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(description.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredDrivers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedQuery) return drivers;
    return drivers.filter((driver) =>
      driver.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
    );
  }, [drivers, query]);

  function openForm() {
    if (pendingAction) return;
    setErrorMessage(null);
    setNotice(null);
    setFormError(null);
    setServerErrors({});
    setFormOpen(true);
  }

  async function authorizeDriver(input: InstitutionalDriverInput) {
    if (!formOpen || pendingAction) return;
    setPendingAction("authorize");
    setErrorMessage(null);
    setNotice(null);
    setFormError(null);
    setServerErrors({});
    try {
      const created = await authorizeInstitutionalDriver(input);
      setDrivers((current) => [created, ...current]);
      setNotice("Motorista institucional autorizado com sucesso.");
      setFormOpen(false);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      const nextServerErrors: Partial<
        Record<InstitutionalDriverField, string>
      > = {};
      for (const [apiField, message] of Object.entries(validationErrors)) {
        if (apiField === "document") {
          nextServerErrors.documentType = message;
          nextServerErrors.documentNumber = message;
          continue;
        }
        const formField = driverFieldNames[apiField];
        if (formField) nextServerErrors[formField] = message;
      }
      const description = describeApiError(error);
      if (description.kind === "access-denied") {
        setStatus("denied");
        setErrorMessage(description.message);
      } else {
        setServerErrors(nextServerErrors);
        setFormError(
          Object.keys(nextServerErrors).length > 0
            ? "Revise os campos destacados e tente novamente."
            : description.message,
        );
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function deactivateDriver(driver: InstitutionalDriver) {
    if (pendingAction) return;
    const confirmed = await confirmAction({
      confirmLabel: "Desativar autorização",
      description: `${driver.name} deixará de aparecer na lista de motoristas autorizados. Os registros anteriores serão preservados.`,
      eyebrow: "Motorista institucional",
      title: "Desativar autorização?",
      tone: "danger",
    });
    if (!confirmed) return;
    setPendingAction(`deactivate-${driver.id}`);
    setNotice(null);
    setErrorMessage(null);
    setFormError(null);
    setServerErrors({});
    try {
      await deactivateInstitutionalDriver(driver.id);
      setDrivers((current) => current.filter((item) => item.id !== driver.id));
      setNotice(`Autorização de ${driver.name} desativada com sucesso.`);
    } catch (error) {
      const description = describeApiError(error);
      if (description.kind === "access-denied") setStatus("denied");
      setErrorMessage(description.message);
    } finally {
      setPendingAction(null);
    }
  }

  if (status === "denied")
    return <AccessDeniedState message={errorMessage ?? undefined} />;

  return (
    <div>
      <PageHeader
        action={
          canManage ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-text hover:bg-primary-hover focus:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:bg-disabled-surface disabled:text-disabled-text disabled:opacity-100"
              disabled={pendingAction !== null}
              onClick={openForm}
              type="button"
            >
              <Icon name="plus" size={18} /> Nova autorização
            </button>
          ) : undefined
        }
        description={
          canManage
            ? "Mantenha as autorizações ativas usadas nas movimentações da frota. Dados de documento não aparecem no catálogo."
            : "Consulte os motoristas autorizados; a manutenção é feita pelo setor responsável."
        }
        eyebrow={canManage ? "Setor de Transporte" : "Consulta operacional"}
        title={canManage ? "Motoristas autorizados" : "Conferir motoristas"}
        variant="prominent"
      />

      {notice && (
        <ActionFeedback
          className="mt-6"
          floating
          focusOnChange
          message={notice}
          onDismiss={() => setNotice(null)}
          tone="success"
        />
      )}

      {errorMessage && status !== "loading" && (
        <ContentState
          action={
            status === "error" ? (
              <button
                className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-700/30"
                onClick={() => void loadDrivers()}
                type="button"
              >
                Tentar novamente
              </button>
            ) : undefined
          }
          className="mt-6"
          title={errorMessage}
          variant="error"
        />
      )}

      {formOpen && status === "ready" && (
        <InstitutionalDriverForm
          busy={pendingAction !== null}
          formError={formError}
          onCancel={() => setFormOpen(false)}
          onSubmit={authorizeDriver}
          serverErrors={serverErrors}
        />
      )}

      <InstitutionalDriverCatalog
        canManage={canManage}
        drivers={drivers}
        filteredDrivers={filteredDrivers}
        onDeactivate={(driver) => void deactivateDriver(driver)}
        onQueryChange={setQuery}
        pendingAction={pendingAction}
        query={query}
        status={status}
      />
    </div>
  );
}
