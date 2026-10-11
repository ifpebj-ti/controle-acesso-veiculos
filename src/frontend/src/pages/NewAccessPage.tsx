import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { SelectField } from "../components/ui/SelectField";
import { TextField } from "../components/ui/TextField";
import {
  accessEntryFormSchema,
  customEntryOption,
  EntryAdditionalDetails,
  EntryCandidateSearch,
  EntryObjectiveFieldset,
  EntryVehicleTypeField,
  generalAccessCategories,
  registerAccessEntry,
  type AccessEntryFormValues,
  type AccessEntryCandidate,
  type RegisterAccessEntryInput,
  vehicleTypeOptions,
} from "../features/access-records";
import {
  EventAuthorizationSelector,
  useCurrentEventAuthorizations,
  type EventAuthorization,
} from "../features/event-authorizations";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";

const fieldNames: Record<string, keyof AccessEntryFormValues> = {
  eventAuthorizationId: "eventAuthorizationId",
  plate: "plate",
  driverName: "driverName",
  categoryName: "categoryName",
  observation: "observation",
};

const defaultValues: AccessEntryFormValues = {
  categoryName: generalAccessCategories[0],
  driverName: "",
  eventAuthorizationId: "",
  objective: "",
  objectiveOther: "",
  observation: "",
  plate: "",
  vehicleType: "",
  vehicleTypeOther: "",
};

type SubmitIntent = "continue" | "review";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-danger-text" id={id}>
      {message}
    </p>
  );
}

export function NewAccessPage() {
  const navigate = useNavigate();
  const [eventSectionOpen, setEventSectionOpen] = useState(false);
  const [additionalDetailsOpen, setAdditionalDetailsOpen] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [pendingIntent, setPendingIntent] = useState<SubmitIntent | null>(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState<AccessEntryCandidate | null>(null);
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
    reset,
    clearErrors,
    setError,
    setFocus,
    setValue,
  } = useForm<AccessEntryFormValues>({
    defaultValues,
    resolver: zodResolver(accessEntryFormSchema),
  });
  const eventAuthorizations = useCurrentEventAuthorizations(eventSectionOpen);
  const selectedEventAuthorizationId = useWatch({
    control,
    name: "eventAuthorizationId",
  });
  const selectedVehicleType = useWatch({ control, name: "vehicleType" });
  const selectedEvent = eventAuthorizations.events.find(
    (event) => String(event.id) === selectedEventAuthorizationId,
  );

  function clearSelectedCandidateAfterEdit(
    editedField: "plate" | "driverName",
  ) {
    if (!selectedCandidate) return;
    setSelectedCandidate(null);
    setValue(editedField === "plate" ? "driverName" : "plate", "", {
      shouldDirty: true,
      shouldValidate: false,
    });
    setValue("vehicleType", "", {
      shouldDirty: true,
      shouldValidate: false,
    });
    setValue("vehicleTypeOther", "", {
      shouldDirty: true,
      shouldValidate: false,
    });
  }

  function useManualEntry() {
    setSelectedCandidate(null);
    setValue("plate", "", { shouldDirty: true, shouldValidate: false });
    setValue("driverName", "", { shouldDirty: true, shouldValidate: false });
    setValue("vehicleType", "", {
      shouldDirty: true,
      shouldValidate: false,
    });
    setValue("vehicleTypeOther", "", {
      shouldDirty: true,
      shouldValidate: false,
    });
    clearErrors(["plate", "driverName", "vehicleType", "vehicleTypeOther"]);
    window.requestAnimationFrame(() =>
      document.getElementById("plate")?.focus(),
    );
  }

  function selectCandidate(candidate: AccessEntryCandidate) {
    setSelectedCandidate(candidate);
    clearErrors(["plate", "driverName", "vehicleType", "vehicleTypeOther"]);
    setValue("plate", candidate.plate, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("driverName", candidate.driverName, {
      shouldDirty: true,
      shouldValidate: true,
    });

    setValue("vehicleType", "", {
      shouldDirty: true,
      shouldValidate: false,
    });
    setValue("vehicleTypeOther", "", {
      shouldDirty: true,
      shouldValidate: false,
    });
    if (!candidate.vehicleType) return;
    const knownVehicleType = vehicleTypeOptions.find(
      (option) =>
        option !== customEntryOption && option === candidate.vehicleType,
    );
    setValue("vehicleType", knownVehicleType ?? customEntryOption, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(
      "vehicleTypeOther",
      knownVehicleType ? "" : candidate.vehicleType,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

  function selectEventAuthorization(event: EventAuthorization | null) {
    clearErrors("eventAuthorizationId");
    setValue("eventAuthorizationId", event ? String(event.id) : "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function submit(values: AccessEntryFormValues, intent: SubmitIntent) {
    setRequestError(null);
    setSuccessNotice(null);
    setPendingIntent(intent);

    try {
      const entryFields = {
        categoryName: values.categoryName,
        driverName: values.driverName,
        objective:
          values.objective === customEntryOption
            ? values.objectiveOther
            : values.objective,
        observation: values.observation || undefined,
        plate: values.plate,
        vehicleType:
          values.vehicleType === customEntryOption
            ? values.vehicleTypeOther
            : values.vehicleType || undefined,
      };
      const input: RegisterAccessEntryInput = selectedCandidate
        ? {
            ...entryFields,
            personId: selectedCandidate.personId,
            vehicleId: selectedCandidate.vehicleId,
          }
        : entryFields;
      if (values.eventAuthorizationId) {
        input.eventAuthorizationId = Number(values.eventAuthorizationId);
      }
      await registerAccessEntry(input);
      if (intent === "review") {
        navigate("/acessos/abertos", {
          state: { notice: "Entrada registrada com sucesso." },
        });
        return;
      }

      reset(defaultValues);
      setSelectedCandidate(null);
      setEventSectionOpen(false);
      setAdditionalDetailsOpen(false);
      setSuccessNotice(
        "Entrada registrada. O formulário está pronto para o próximo veículo.",
      );
      window.requestAnimationFrame(() =>
        document.getElementById("plate")?.focus(),
      );
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      const accessRecordError = validationErrors.accessRecord;
      let hasFieldError = false;

      for (const [apiField, message] of Object.entries(validationErrors)) {
        if (apiField === "accessRecord") continue;
        const formField =
          apiField === "objective"
            ? values.objective === customEntryOption
              ? "objectiveOther"
              : "objective"
            : apiField === "vehicleType"
              ? values.vehicleType === customEntryOption
                ? "vehicleTypeOther"
                : "vehicleType"
              : fieldNames[apiField];
        if (!formField) continue;
        if (formField === "observation") setAdditionalDetailsOpen(true);
        setError(formField, { message, type: "server" });
        hasFieldError = true;
      }

      const description = describeApiError(error);
      setRequestError(
        accessRecordError ??
          (hasFieldError
            ? "Revise os campos destacados e tente novamente."
            : description.message),
      );
    } finally {
      setPendingIntent(null);
    }
  }

  function handleInvalidSubmission() {
    setRequestError(null);
    setSuccessNotice(null);
  }

  const submitAndContinue = handleSubmit(
    (values) => submit(values, "continue"),
    handleInvalidSubmission,
  );
  const submitAndReview = handleSubmit(
    (values) => submit(values, "review"),
    handleInvalidSubmission,
  );

  return (
    <div>
      <PageHeader
        description="Registre o veículo, o condutor e a finalidade do acesso geral. O horário oficial é definido pelo servidor."
        eyebrow="Operação da portaria"
        title="Registrar entrada"
      />

      {successNotice && (
        <div
          className="mt-6 rounded-xl border border-success-border bg-success-surface p-4 text-sm font-semibold text-success-text"
          role="status"
        >
          {successNotice}
        </div>
      )}

      {requestError && (
        <div
          className="mt-6 rounded-xl border border-danger-border bg-danger-surface p-4 text-sm text-danger-text"
          role="alert"
        >
          {requestError}
        </div>
      )}

      <form
        className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]"
        noValidate
        onSubmit={submitAndContinue}
      >
        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border bg-surface-subtle px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Fluxo geral de veículos
            </p>
            <h2 className="mt-2 text-2xl font-bold text-text">
              Dados da entrada
            </h2>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            <EntryCandidateSearch
              onClear={useManualEntry}
              onSelect={selectCandidate}
              selectedCandidate={selectedCandidate}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="plate"
                >
                  Placa do veículo <span className="text-danger-text">*</span>
                </label>
                <TextField
                  aria-describedby={errors.plate ? "plate-error" : undefined}
                  aria-invalid={Boolean(errors.plate)}
                  autoCapitalize="characters"
                  className="mt-2"
                  id="plate"
                  maxLength={10}
                  placeholder="Ex.: DEM-1A23"
                  {...register("plate", {
                    onChange: () => clearSelectedCandidateAfterEdit("plate"),
                  })}
                />
                <FieldError id="plate-error" message={errors.plate?.message} />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="driverName"
                >
                  Nome do condutor <span className="text-danger-text">*</span>
                </label>
                <TextField
                  aria-describedby={
                    errors.driverName ? "driverName-error" : undefined
                  }
                  aria-invalid={Boolean(errors.driverName)}
                  autoComplete="off"
                  className="mt-2"
                  id="driverName"
                  maxLength={200}
                  placeholder="Ex.: Pessoa de demonstração"
                  {...register("driverName", {
                    onChange: () =>
                      clearSelectedCandidateAfterEdit("driverName"),
                  })}
                />
                <FieldError
                  id="driverName-error"
                  message={errors.driverName?.message}
                />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="categoryName"
                >
                  Categoria do acesso{" "}
                  <span className="text-danger-text">*</span>
                </label>
                <Controller
                  control={control}
                  name="categoryName"
                  render={({ field }) => (
                    <SelectField
                      aria-describedby={
                        errors.categoryName ? "categoryName-error" : undefined
                      }
                      aria-invalid={Boolean(errors.categoryName)}
                      className="mt-2"
                      id="categoryName"
                      name={field.name}
                      onBlur={field.onBlur}
                      onValueChange={field.onChange}
                      options={generalAccessCategories.map((option) => ({
                        label: option,
                        value: option,
                      }))}
                      required
                      value={field.value}
                    />
                  )}
                />
                <FieldError
                  id="categoryName-error"
                  message={errors.categoryName?.message}
                />
              </div>

              <EntryVehicleTypeField
                clearErrors={clearErrors}
                control={control}
                errors={errors}
                register={register}
                selectedVehicleType={selectedVehicleType}
                setFocus={setFocus}
              />

              <Controller
                control={control}
                name="objective"
                render={({ field }) => (
                  <EntryObjectiveFieldset
                    clearErrors={clearErrors}
                    errors={errors}
                    fieldRef={field.ref}
                    onBlur={field.onBlur}
                    onSelect={field.onChange}
                    register={register}
                    selectedObjective={field.value}
                  />
                )}
              />

              <EntryAdditionalDetails
                errors={errors}
                onOpenChange={setAdditionalDetailsOpen}
                open={additionalDetailsOpen}
                register={register}
              />
            </div>

            <section
              className="rounded-xl border border-border bg-surface-subtle p-4 sm:p-5"
              aria-labelledby="event-link-title"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className="text-xl font-bold text-text"
                      id="event-link-title"
                    >
                      Autorização de evento
                    </h3>
                    <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-bold text-text-muted">
                      Opcional
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-soft">
                    Escolha uma autorização vigente ou mantenha a entrada sem
                    vínculo.
                  </p>
                  {selectedEvent && !eventSectionOpen && (
                    <p className="mt-2 text-sm font-bold text-brand-dark">
                      Evento vinculado: {selectedEvent.name}
                    </p>
                  )}
                </div>
                <Button
                  aria-label={
                    eventSectionOpen
                      ? "Ocultar autorizações de evento"
                      : selectedEvent
                        ? "Alterar autorização vinculada"
                        : "Vincular uma autorização de evento"
                  }
                  aria-controls="event-authorization-options"
                  aria-expanded={eventSectionOpen}
                  onClick={() => setEventSectionOpen((current) => !current)}
                  type="button"
                  variant="secondary"
                >
                  {eventSectionOpen
                    ? "Ocultar"
                    : selectedEvent
                      ? "Alterar"
                      : "Vincular a evento"}
                </Button>
              </div>

              {eventSectionOpen && (
                <div className="mt-5" id="event-authorization-options">
                  <EventAuthorizationSelector
                    errorMessage={eventAuthorizations.errorMessage}
                    events={eventAuthorizations.events}
                    onRetry={() => void eventAuthorizations.retry()}
                    onSelect={selectEventAuthorization}
                    selectedId={
                      selectedEventAuthorizationId
                        ? Number(selectedEventAuthorizationId)
                        : null
                    }
                    selectionError={errors.eventAuthorizationId?.message}
                    status={eventAuthorizations.status}
                  />
                </div>
              )}
            </section>

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                disabled={isSubmitting}
                onClick={() => navigate("/visao-geral")}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting && pendingIntent === "continue"
                  ? "Registrando…"
                  : "Registrar e continuar"}
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() => void submitAndReview()}
                type="button"
                variant="secondary"
              >
                {isSubmitting && pendingIntent === "review"
                  ? "Registrando…"
                  : "Registrar e ver acessos"}
              </Button>
            </div>
          </div>
        </section>

        <aside className="h-fit space-y-4 xl:sticky xl:top-8">
          <section className="rounded-xl border border-border bg-surface-subtle p-6 text-text">
            <p className="text-xs font-bold uppercase tracking-[0.14em]">
              Conferência rápida
            </p>
            <ol className="mt-5 space-y-4 text-sm leading-6">
              <li className="flex gap-3">
                <strong>1.</strong>
                <span>Confirme a placa com o veículo.</span>
              </li>
              <li className="flex gap-3">
                <strong>2.</strong>
                <span>Confirme o nome do condutor.</span>
              </li>
              <li className="flex gap-3">
                <strong>3.</strong>
                <span>Registre apenas os dados necessários.</span>
              </li>
            </ol>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-subtle text-text">
                <Icon name="bus" size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">
                  Veículo institucional
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  Saída, quilometragem, motorista e retorno são registrados em
                  <Link
                    className="ml-1 inline rounded font-bold text-ink underline decoration-ink/45 underline-offset-2 hover:decoration-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                    to="/utilizacoes-institucionais"
                  >
                    Utilizações da frota
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
