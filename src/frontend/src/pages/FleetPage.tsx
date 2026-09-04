import { useCallback, useEffect, useMemo, useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuthenticatedSession } from "../features/authentication";
import {
  createInstitutionalVehicle,
  deactivateInstitutionalVehicle,
  InstitutionalVehicleCatalog,
  InstitutionalVehicleForm,
  listInstitutionalVehicles,
  updateInstitutionalVehicle,
  type InstitutionalVehicle,
  type InstitutionalVehicleField,
  type InstitutionalVehicleInput,
} from "../features/institutional-vehicles";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";

const manageableProfiles = ["SetorTransporte", "Administrador"];
const vehicleFieldNames: Record<string, InstitutionalVehicleField> = {
  brand: "brand",
  color: "color",
  identification: "identification",
  model: "model",
  plate: "plate",
  vehicleType: "vehicleType",
  year: "year",
};

type FormState =
  { mode: "create" } | { mode: "edit"; vehicle: InstitutionalVehicle } | null;

export function FleetPage() {
  const { user } = useAuthenticatedSession();
  const canManageFleet = manageableProfiles.includes(user.profileName);
  const [vehicles, setVehicles] = useState<InstitutionalVehicle[]>([]);
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "denied"
  >("loading");
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<InstitutionalVehicleField, string>>
  >({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    setStatus("loading");
    setVehicles([]);
    setErrorMessage(null);

    try {
      setVehicles(await listInstitutionalVehicles());
      setStatus("ready");
    } catch (error) {
      const description = describeApiError(error);
      setVehicles([]);
      setStatus(description.kind === "access-denied" ? "denied" : "error");
      setErrorMessage(description.message);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void listInstitutionalVehicles()
      .then((response) => {
        if (!active) return;
        setVehicles(response);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        const description = describeApiError(error);
        setVehicles([]);
        setStatus(description.kind === "access-denied" ? "denied" : "error");
        setErrorMessage(description.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedQuery) return vehicles;

    return vehicles.filter((vehicle) =>
      [
        vehicle.plate,
        vehicle.identification,
        vehicle.vehicleType,
        vehicle.brand,
        vehicle.model,
        vehicle.color,
        vehicle.year?.toString(),
      ].some((value) =>
        value?.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
      ),
    );
  }, [query, vehicles]);

  function openForm(nextState: FormState) {
    setFormError(null);
    setServerErrors({});
    setFormState(nextState);
  }

  async function saveVehicle(input: InstitutionalVehicleInput) {
    if (!formState || pendingAction) return;

    setPendingAction("save");
    setFormError(null);
    setServerErrors({});

    try {
      if (formState.mode === "create") {
        const created = await createInstitutionalVehicle(input);
        setVehicles((current) => [created, ...current]);
        setNotice("Veículo institucional cadastrado com sucesso.");
      } else {
        const updated = await updateInstitutionalVehicle(
          formState.vehicle.id,
          input,
        );
        setVehicles((current) =>
          current.map((vehicle) =>
            vehicle.id === updated.id ? updated : vehicle,
          ),
        );
        setNotice("Dados do veículo atualizados com sucesso.");
      }
      setFormState(null);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      const nextServerErrors: Partial<
        Record<InstitutionalVehicleField, string>
      > = {};

      for (const [apiField, message] of Object.entries(validationErrors)) {
        const formField = vehicleFieldNames[apiField];
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

  async function deactivateVehicle(vehicle: InstitutionalVehicle) {
    if (pendingAction) return;
    const label = vehicle.plate ?? vehicle.identification ?? "selecionado";
    if (
      !window.confirm(
        `Desativar o veículo ${label}? Ele deixará de aparecer na lista ativa, mas o histórico será preservado.`,
      )
    )
      return;

    setPendingAction(`deactivate-${vehicle.id}`);
    setErrorMessage(null);
    try {
      await deactivateInstitutionalVehicle(vehicle.id);
      setVehicles((current) =>
        current.filter((item) => item.id !== vehicle.id),
      );
      setNotice(`Veículo ${label} desativado com sucesso.`);
      if (formState?.mode === "edit" && formState.vehicle.id === vehicle.id) {
        setFormState(null);
      }
    } catch (error) {
      const description = describeApiError(error);
      if (description.kind === "access-denied") setStatus("denied");
      setErrorMessage(description.message);
    } finally {
      setPendingAction(null);
    }
  }

  if (status === "denied") {
    return <AccessDeniedState message={errorMessage ?? undefined} />;
  }

  return (
    <div>
      <PageHeader
        action={
          canManageFleet ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
              onClick={() => openForm({ mode: "create" })}
              type="button"
            >
              <Icon name="plus" size={18} /> Novo veículo
            </button>
          ) : undefined
        }
        description={
          canManageFleet
            ? "Mantenha os dados dos veículos ativos usados pelo campus. Motoristas e movimentações pertencem a fluxos separados."
            : "Consulte a identificação já cadastrada antes da movimentação; a manutenção é feita pelo setor responsável."
        }
        eyebrow={
          canManageFleet ? "Setor de Transporte" : "Consulta operacional"
        }
        title={
          canManageFleet
            ? "Frota institucional"
            : "Conferir frota institucional"
        }
      />

      {notice && (
        <div
          className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          role="status"
        >
          <p>{notice}</p>
          <button
            className="shrink-0 rounded-md font-bold underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            onClick={() => setNotice(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      {errorMessage && status !== "loading" && (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          <p>{errorMessage}</p>
          {status === "error" && (
            <button
              className="min-h-10 rounded-xl border border-red-300 px-4 font-bold"
              onClick={() => void loadVehicles()}
              type="button"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {formState && status === "ready" && (
        <>
          {formError && (
            <div
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
              role="alert"
            >
              {formError}
            </div>
          )}
          <InstitutionalVehicleForm
            busy={pendingAction === "save"}
            key={
              formState.mode === "create"
                ? "create"
                : `edit-${formState.vehicle.id}`
            }
            mode={formState.mode}
            onCancel={() => setFormState(null)}
            onSubmit={saveVehicle}
            serverErrors={serverErrors}
            vehicle={formState.mode === "edit" ? formState.vehicle : undefined}
          />
        </>
      )}

      <InstitutionalVehicleCatalog
        canManage={canManageFleet}
        filteredVehicles={filteredVehicles}
        onDeactivate={(vehicle) => void deactivateVehicle(vehicle)}
        onEdit={(vehicle) => openForm({ mode: "edit", vehicle })}
        onQueryChange={setQuery}
        pendingAction={pendingAction}
        query={query}
        status={status}
        vehicles={vehicles}
      />
    </div>
  );
}
