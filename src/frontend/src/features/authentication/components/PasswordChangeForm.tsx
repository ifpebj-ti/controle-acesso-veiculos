import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { TextField } from "../../../components/ui/TextField";

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

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="mt-1.5 text-sm font-semibold text-danger-text" id={id}>
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
        <label className="font-semibold text-text" htmlFor="current-password">
          Senha atual
        </label>
        <div className="relative mt-2">
          <Icon
            aria-hidden="true"
            className="password-change-field-icon"
            name="lock"
            size={17}
          />
          <TextField
            aria-describedby={
              errors.currentPassword
                ? "current-password-help current-password-error"
                : "current-password-help"
            }
            aria-invalid={Boolean(errors.currentPassword)}
            autoComplete="current-password"
            className="password-change-field"
            disabled={isSubmitting}
            id="current-password"
            type="password"
            {...register("currentPassword")}
          />
        </div>
        <p
          className="mt-1.5 text-sm text-text-muted"
          id="current-password-help"
        >
          Confirme a senha que você usa atualmente.
        </p>
        <FieldError
          id="current-password-error"
          message={errors.currentPassword?.message}
        />
      </div>

      <div>
        <label className="font-semibold text-text" htmlFor="new-password">
          Nova senha
        </label>
        <div className="relative mt-2">
          <Icon
            aria-hidden="true"
            className="password-change-field-icon"
            name="lock"
            size={17}
          />
          <TextField
            aria-describedby={
              errors.newPassword
                ? "new-password-help new-password-error"
                : "new-password-help"
            }
            aria-invalid={Boolean(errors.newPassword)}
            autoComplete="new-password"
            className="password-change-field"
            disabled={isSubmitting}
            id="new-password"
            type="password"
            {...register("newPassword")}
          />
        </div>
        <p className="mt-1.5 text-sm text-text-muted" id="new-password-help">
          Use entre 12 e 128 caracteres e não repita a senha atual.
        </p>
        <FieldError
          id="new-password-error"
          message={errors.newPassword?.message}
        />
      </div>

      <div>
        <label
          className="font-semibold text-text"
          htmlFor="confirm-new-password"
        >
          Confirmar nova senha
        </label>
        <div className="relative mt-2">
          <Icon
            aria-hidden="true"
            className="password-change-field-icon"
            name="lock"
            size={17}
          />
          <TextField
            aria-describedby={
              errors.confirmNewPassword
                ? "confirm-new-password-help confirm-new-password-error"
                : "confirm-new-password-help"
            }
            aria-invalid={Boolean(errors.confirmNewPassword)}
            autoComplete="new-password"
            className="password-change-field"
            disabled={isSubmitting}
            id="confirm-new-password"
            type="password"
            {...register("confirmNewPassword")}
          />
        </div>
        <p
          className="mt-1.5 text-sm text-text-muted"
          id="confirm-new-password-help"
        >
          Repita exatamente a nova senha escolhida.
        </p>
        <FieldError
          id="confirm-new-password-error"
          message={errors.confirmNewPassword?.message}
        />
      </div>

      {errors.root?.server?.message && (
        <div
          aria-atomic="true"
          className="rounded-xl border border-danger-border bg-danger-surface p-4 text-sm font-semibold text-danger-text focus:outline-3 focus:outline-offset-3 focus:outline-focus"
          ref={statusRef}
          role="alert"
          tabIndex={-1}
        >
          {errors.root.server.message}
        </div>
      )}

      <Button
        className="w-full gap-2 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Alterando senha…" : "Alterar senha"}
        {!isSubmitting && (
          <Icon aria-hidden="true" name="arrow-right" size={17} />
        )}
      </Button>
    </form>
  );
}
