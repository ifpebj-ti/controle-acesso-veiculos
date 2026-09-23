import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { SelectField } from "../../../components/ui/SelectField";
import { profileLabels } from "../../authentication";
import {
  createUserAccountFormSchema,
  type CreateUserAccountFormValues,
} from "../schemas/userAccountSchemas";
import type { CreateUserAccountInput, UserAccountServerErrors } from "../types";

interface UserAccountFormProps {
  busy: boolean;
  onCancel: () => void;
  onFieldChange: (field: keyof UserAccountServerErrors) => void;
  onSubmit: (input: CreateUserAccountInput) => Promise<void>;
  serverErrors: UserAccountServerErrors;
}

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-cream/55 px-4 text-ink outline-none transition placeholder:text-ink-soft focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20 disabled:cursor-wait disabled:opacity-60";

type CreateAccountField = "email" | "name" | "profileName";

function errorId(field: CreateAccountField) {
  return `account-${field}-error`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-red-800" id={id}>
      {message}
    </p>
  );
}

export function UserAccountForm({
  busy,
  onCancel,
  onFieldChange,
  onSubmit,
  serverErrors,
}: UserAccountFormProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
  } = useForm<CreateUserAccountFormValues>({
    defaultValues: {
      email: "",
      name: "",
      profileName: "Porteiro",
    },
    resolver: zodResolver(createUserAccountFormSchema),
  });
  const disabled = busy || isSubmitting;

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function registration(field: CreateAccountField) {
    const registered = register(field);
    return {
      ...registered,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        onFieldChange(field);
        void registered.onChange(event);
      },
    };
  }

  function errorFor(field: CreateAccountField) {
    return errors[field]?.message ?? serverErrors[field];
  }

  return (
    <section
      aria-labelledby="account-form-title"
      className="mt-6 overflow-hidden rounded-[2rem] border border-brand-dark/15 bg-white shadow-[0_14px_40px_rgba(1,36,40,0.07)]"
    >
      <div className="border-b border-ink/8 bg-brand-soft/30 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Acesso individual
        </p>
        <h2
          className="mt-3 font-display text-2xl text-ink"
          id="account-form-title"
          ref={titleRef}
          tabIndex={-1}
        >
          Criar conta
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
          Informe os dados da pessoa. O sistema criará uma credencial temporária
          somente depois que a conta for cadastrada com sucesso.
        </p>
      </div>

      <form
        className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="account-name"
          >
            Nome da pessoa
          </label>
          <input
            aria-describedby={errorFor("name") ? errorId("name") : undefined}
            aria-invalid={Boolean(errorFor("name"))}
            autoComplete="name"
            className={fieldClass}
            disabled={disabled}
            id="account-name"
            maxLength={200}
            {...registration("name")}
          />
          <FieldError id={errorId("name")} message={errorFor("name")} />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="account-email"
          >
            E-mail de acesso
          </label>
          <input
            aria-describedby={errorFor("email") ? errorId("email") : undefined}
            aria-invalid={Boolean(errorFor("email"))}
            autoCapitalize="none"
            autoComplete="email"
            className={fieldClass}
            disabled={disabled}
            id="account-email"
            maxLength={254}
            type="email"
            {...registration("email")}
          />
          <FieldError id={errorId("email")} message={errorFor("email")} />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-ink"
            htmlFor="account-profile"
          >
            Perfil de acesso
          </label>
          <Controller
            control={control}
            name="profileName"
            render={({ field }) => (
              <SelectField
                aria-describedby={
                  errorFor("profileName") ? errorId("profileName") : undefined
                }
                aria-invalid={Boolean(errorFor("profileName"))}
                className={fieldClass}
                disabled={disabled}
                id="account-profile"
                name={field.name}
                onBlur={field.onBlur}
                onValueChange={(value) => {
                  onFieldChange("profileName");
                  field.onChange(value);
                }}
                options={Object.entries(profileLabels).map(
                  ([value, label]) => ({ label, value }),
                )}
                value={field.value}
              />
            )}
          />
          <FieldError
            id={errorId("profileName")}
            message={errorFor("profileName")}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
          <button
            className="min-h-12 rounded-xl border border-ink/20 px-5 font-bold text-ink hover:bg-cream focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/25 disabled:cursor-wait disabled:opacity-60"
            disabled={disabled}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="min-h-12 rounded-xl bg-brand-dark px-7 font-bold text-white hover:bg-ink focus:outline-none focus-visible:ring-3 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:bg-brand-soft disabled:text-ink disabled:opacity-100"
            disabled={disabled}
            type="submit"
          >
            {disabled ? "Criando…" : "Criar conta"}
          </button>
        </div>
      </form>
    </section>
  );
}
