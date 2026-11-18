import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { ActionFeedback } from "../../../components/ui/ActionFeedback";
import { SelectField } from "../../../components/ui/SelectField";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { profileLabels } from "../../authentication";
import {
  createUserAccountFormSchema,
  type CreateUserAccountFormValues,
} from "../schemas/userAccountSchemas";
import type { CreateUserAccountInput, UserAccountServerErrors } from "../types";

interface UserAccountFormProps {
  busy: boolean;
  formError?: string | null;
  onCancel: () => void;
  onFieldChange: (field: keyof UserAccountServerErrors) => void;
  onSubmit: (input: CreateUserAccountInput) => Promise<void>;
  serverErrors: UserAccountServerErrors;
}

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-ink outline-none transition placeholder:text-ink-soft focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-wait disabled:opacity-60";

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
  formError,
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
      className="account-form-shell mt-6 overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="account-form-heading border-b border-border bg-success-surface/60 px-5 py-5 sm:px-7">
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
          Informe os dados da pessoa. Após o cadastro, o sistema informará o
          método de acesso e exibirá uma credencial temporária somente quando
          ela for emitida.
        </p>
      </div>

      <form
        className="account-form-body grid gap-5 p-5 sm:grid-cols-2 sm:p-7"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <label
            className="flex items-center gap-2 text-sm font-semibold text-ink"
            htmlFor="account-name"
          >
            <Icon className="text-primary" name="user" size={17} />
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
            className="flex items-center gap-2 text-sm font-semibold text-ink"
            htmlFor="account-email"
          >
            <Icon className="text-primary" name="mail" size={17} />
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
            className="flex items-center gap-2 text-sm font-semibold text-ink"
            htmlFor="account-profile"
          >
            <Icon className="text-primary" name="shield" size={17} />
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

        <ActionFeedback
          className="sm:col-span-2"
          message={formError}
          tone="error"
        />
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button disabled={disabled} onClick={onCancel} variant="secondary">
            Cancelar
          </Button>
          <Button className="px-7" disabled={disabled} type="submit">
            {disabled ? "Criando…" : "Criar conta"}
          </Button>
        </div>
      </form>
    </section>
  );
}
