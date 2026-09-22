import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import {
  passwordChangeFormSchema,
  type PasswordChangeFormValues,
} from "../schemas/passwordChangeSchema";
import { changeAuthenticatedPassword } from "../services/passwordChangeService";

interface PasswordChangeFormProps {
  onSuccess: () => void;
}

const initialValues: PasswordChangeFormValues = {
  confirmNewPassword: "",
  currentPassword: "",
  newPassword: "",
};

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-white px-4 text-ink outline-none transition focus:border-brand-dark focus:ring-3 focus:ring-brand/20 disabled:cursor-wait disabled:bg-cream/60";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="mt-1.5 text-sm font-semibold text-red-800" id={id}>
      {message}
    </p>
  ) : null;
}

export function PasswordChangeForm({ onSuccess }: PasswordChangeFormProps) {
  const statusRef = useRef<HTMLDivElement>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    resetField,
    setError,
    setFocus,
  } = useForm<PasswordChangeFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(passwordChangeFormSchema),
  });

  useEffect(
    () => () => {
      reset(initialValues);
    },
    [reset],
  );

  useEffect(() => {
    if (errors.root?.server) statusRef.current?.focus();
  }, [errors.root?.server]);

  const submitPasswordChange = handleSubmit(async (values) => {
    try {
      await changeAuthenticatedPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset(initialValues);
      onSuccess();
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      const currentPasswordError = validationErrors.currentPassword;
      const newPasswordError = validationErrors.newPassword;

      resetField("currentPassword");

      if (currentPasswordError) {
        setError("currentPassword", {
          message: currentPasswordError,
          type: "server",
        });
      }
      if (newPasswordError) {
        setError("newPassword", {
          message: newPasswordError,
          type: "server",
        });
      }

      if (currentPasswordError) {
        setFocus("currentPassword");
        return;
      }
      if (newPasswordError) {
        setFocus("newPassword");
        return;
      }

      const description = describeApiError(error);
      setError("root.server", { message: description.message });
    }
  });

  return (
    <form className="space-y-5" noValidate onSubmit={submitPasswordChange}>
      <div>
        <label className="font-bold text-ink" htmlFor="current-password">
          Senha atual
        </label>
        <input
          aria-describedby={
            errors.currentPassword
              ? "current-password-help current-password-error"
              : "current-password-help"
          }
          aria-invalid={Boolean(errors.currentPassword)}
          autoComplete="current-password"
          className={fieldClass}
          disabled={isSubmitting}
          id="current-password"
          type="password"
          {...register("currentPassword")}
        />
        <p className="mt-1.5 text-sm text-ink-soft" id="current-password-help">
          Confirme a senha que você usa atualmente.
        </p>
        <FieldError
          id="current-password-error"
          message={errors.currentPassword?.message}
        />
      </div>

      <div>
        <label className="font-bold text-ink" htmlFor="new-password">
          Nova senha
        </label>
        <input
          aria-describedby={
            errors.newPassword
              ? "new-password-help new-password-error"
              : "new-password-help"
          }
          aria-invalid={Boolean(errors.newPassword)}
          autoComplete="new-password"
          className={fieldClass}
          disabled={isSubmitting}
          id="new-password"
          type="password"
          {...register("newPassword")}
        />
        <p className="mt-1.5 text-sm text-ink-soft" id="new-password-help">
          Use entre 12 e 128 caracteres e não repita a senha atual.
        </p>
        <FieldError
          id="new-password-error"
          message={errors.newPassword?.message}
        />
      </div>

      <div>
        <label className="font-bold text-ink" htmlFor="confirm-new-password">
          Confirmar nova senha
        </label>
        <input
          aria-describedby={
            errors.confirmNewPassword ? "confirm-new-password-error" : undefined
          }
          aria-invalid={Boolean(errors.confirmNewPassword)}
          autoComplete="new-password"
          className={fieldClass}
          disabled={isSubmitting}
          id="confirm-new-password"
          type="password"
          {...register("confirmNewPassword")}
        />
        <FieldError
          id="confirm-new-password-error"
          message={errors.confirmNewPassword?.message}
        />
      </div>

      {errors.root?.server?.message && (
        <div
          aria-atomic="true"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 outline-none focus:ring-3 focus:ring-red-700/30"
          ref={statusRef}
          role="alert"
          tabIndex={-1}
        >
          {errors.root.server.message}
        </div>
      )}

      <button
        className="min-h-12 w-full rounded-xl bg-ink px-5 py-3 font-bold text-white transition hover:bg-ink-soft focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/35 disabled:cursor-wait disabled:opacity-65 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Alterando senha…" : "Alterar senha"}
      </button>
    </form>
  );
}
