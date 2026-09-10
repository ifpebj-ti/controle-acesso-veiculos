import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import {
  accessEntryFormSchema,
  generalAccessCategories,
  registerAccessEntry,
  type AccessEntryFormValues,
} from "../features/access-records";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

const fieldNames: Record<string, keyof AccessEntryFormValues> = {
  plate: "plate",
  driverName: "driverName",
  categoryName: "categoryName",
  objective: "objective",
  vehicleType: "vehicleType",
  observation: "observation",
};

const defaultValues: AccessEntryFormValues = {
  categoryName: generalAccessCategories[0],
  driverName: "",
  objective: "",
  observation: "",
  plate: "",
  vehicleType: "",
};

type SubmitIntent = "continue" | "review";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-red-800" id={id}>
      {message}
    </p>
  );
}

export function NewAccessPage() {
  const navigate = useNavigate();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [pendingIntent, setPendingIntent] = useState<SubmitIntent | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<AccessEntryFormValues>({
    defaultValues,
    resolver: zodResolver(accessEntryFormSchema),
  });

  async function submit(values: AccessEntryFormValues, intent: SubmitIntent) {
    setRequestError(null);
    setSuccessNotice(null);
    setPendingIntent(intent);

    try {
      await registerAccessEntry({
        ...values,
        observation: values.observation || undefined,
        vehicleType: values.vehicleType || undefined,
      });
      if (intent === "review") {
        navigate("/acessos/abertos", {
          state: { notice: "Entrada registrada com sucesso." },
        });
        return;
      }

      reset(defaultValues);
      setSuccessNotice(
        "Entrada registrada. O formulário está pronto para o próximo veículo.",
      );
      window.requestAnimationFrame(() =>
        document.getElementById("plate")?.focus(),
      );
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      let hasFieldError = false;

      for (const [apiField, message] of Object.entries(validationErrors)) {
        const formField = fieldNames[apiField];
        if (!formField) continue;
        setError(formField, { message, type: "server" });
        hasFieldError = true;
      }

      const description = describeApiError(error);
      setRequestError(
        hasFieldError
          ? "Revise os campos destacados e tente novamente."
          : description.message,
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
          className="mt-6 rounded-2xl border border-brand/30 bg-brand/10 p-4 text-sm font-semibold text-brand-dark"
          role="status"
        >
          {successNotice}
        </div>
      )}

      {requestError && (
        <div
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
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
        <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_14px_40px_rgba(1,36,40,0.06)]">
          <div className="border-b border-ink/8 bg-[#B8C9A4]/25 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Fluxo geral de veículos
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Dados da entrada
            </h2>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="plate"
                >
                  Placa do veículo <span className="text-red-700">*</span>
                </label>
                <input
                  aria-describedby={errors.plate ? "plate-error" : undefined}
                  aria-invalid={Boolean(errors.plate)}
                  autoFocus
                  autoCapitalize="characters"
                  className={fieldClass}
                  id="plate"
                  maxLength={10}
                  placeholder="Ex.: DEM-1A23"
                  {...register("plate")}
                />
                <FieldError id="plate-error" message={errors.plate?.message} />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="driverName"
                >
                  Nome do condutor <span className="text-red-700">*</span>
                </label>
                <input
                  aria-describedby={
                    errors.driverName ? "driverName-error" : undefined
                  }
                  aria-invalid={Boolean(errors.driverName)}
                  autoComplete="off"
                  className={fieldClass}
                  id="driverName"
                  maxLength={200}
                  placeholder="Ex.: Pessoa de demonstração"
                  {...register("driverName")}
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
                  Categoria do acesso <span className="text-red-700">*</span>
                </label>
                <select
                  aria-describedby={
                    errors.categoryName ? "categoryName-error" : undefined
                  }
                  aria-invalid={Boolean(errors.categoryName)}
                  className={fieldClass}
                  id="categoryName"
                  {...register("categoryName")}
                >
                  {generalAccessCategories.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <FieldError
                  id="categoryName-error"
                  message={errors.categoryName?.message}
                />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="vehicleType"
                >
                  Tipo do veículo{" "}
                  <span className="font-normal text-ink/50">(opcional)</span>
                </label>
                <input
                  aria-describedby={
                    errors.vehicleType ? "vehicleType-error" : undefined
                  }
                  aria-invalid={Boolean(errors.vehicleType)}
                  className={fieldClass}
                  id="vehicleType"
                  maxLength={50}
                  placeholder="Ex.: Automóvel"
                  {...register("vehicleType")}
                />
                <FieldError
                  id="vehicleType-error"
                  message={errors.vehicleType?.message}
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="objective"
                >
                  Objetivo do acesso <span className="text-red-700">*</span>
                </label>
                <textarea
                  aria-describedby={
                    errors.objective ? "objective-error" : undefined
                  }
                  aria-invalid={Boolean(errors.objective)}
                  className={`${fieldClass} min-h-28 py-3`}
                  id="objective"
                  maxLength={500}
                  placeholder="Descreva de forma objetiva a finalidade da entrada."
                  {...register("objective")}
                />
                <FieldError
                  id="objective-error"
                  message={errors.objective?.message}
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="observation"
                >
                  Observação{" "}
                  <span className="font-normal text-ink/50">(opcional)</span>
                </label>
                <textarea
                  aria-describedby={
                    errors.observation ? "observation-error" : undefined
                  }
                  aria-invalid={Boolean(errors.observation)}
                  className={`${fieldClass} min-h-24 py-3`}
                  id="observation"
                  maxLength={1000}
                  placeholder="Inclua somente informação necessária para a operação."
                  {...register("observation")}
                />
                <FieldError
                  id="observation-error"
                  message={errors.observation?.message}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
                disabled={isSubmitting}
                onClick={() => navigate("/visao-geral")}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="min-h-12 rounded-xl bg-brand-dark px-7 font-bold text-white shadow-sm hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:bg-brand-soft disabled:text-ink disabled:opacity-100"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting && pendingIntent === "continue"
                  ? "Registrando…"
                  : "Registrar e continuar"}
              </button>
              <button
                className="min-h-12 rounded-xl border border-brand-dark px-5 font-bold text-brand-dark hover:bg-brand/10 focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25 disabled:cursor-wait disabled:opacity-65"
                disabled={isSubmitting}
                onClick={() => void submitAndReview()}
                type="button"
              >
                {isSubmitting && pendingIntent === "review"
                  ? "Registrando…"
                  : "Registrar e ver acessos"}
              </button>
            </div>
          </div>
        </section>

        <aside className="h-fit space-y-4 xl:sticky xl:top-8">
          <section className="rounded-[2rem] bg-[#B8C9A4] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/55">
              Conferência rápida
            </p>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-ink/75">
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

          <section className="rounded-[2rem] border border-[#BDD8F1] bg-[#BDD8F1]/30 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-ink">
                <Icon name="bus" size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">
                  Veículo institucional
                </p>
                <p className="mt-1 text-xs leading-5 text-ink/65">
                  Saída, quilometragem, motorista e retorno pertencem ao fluxo
                  próprio da frota.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
