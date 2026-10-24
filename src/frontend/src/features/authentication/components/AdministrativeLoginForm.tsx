import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { TextField } from "../../../components/ui/TextField";
import { describeApiError } from "../../../services/api-errors";
import { loginSchema, type LoginFormValues } from "../schemas/loginSchema";
import { AuthenticationContractError } from "../services/authenticationService";
import { useSession } from "../session/useSession";
import type { AuthenticatedUser } from "../types";

interface AdministrativeLoginFormProps {
  externalDescriptionId?: string;
  onAuthenticated: (user: AuthenticatedUser) => void;
}

function loginErrorMessage(error: unknown) {
  if (error instanceof AuthenticationContractError) {
    return "A resposta de autenticação não pôde ser validada. Tente novamente mais tarde.";
  }

  const apiError = describeApiError(error);
  return apiError.status === 401
    ? "E-mail ou senha incorretos."
    : apiError.message;
}

export function AdministrativeLoginForm({
  externalDescriptionId,
  onAuthenticated,
}: AdministrativeLoginFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { login } = useSession();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(loginSchema),
  });
  const emailValue = useWatch({ control, name: "email" });
  const passwordValue = useWatch({ control, name: "password" });
  const emailDescriptionIds = [
    errors.email ? "email-error" : null,
    errors.root?.server ? "administrative-login-error" : null,
    externalDescriptionId,
  ]
    .filter(Boolean)
    .join(" ");
  const submitLogin = handleSubmit(async (values) => {
    try {
      onAuthenticated(await login(values));
    } catch (error) {
      setError("root.server", { message: loginErrorMessage(error) });
    }
  });

  return (
    <form className="mt-5 space-y-5" noValidate onSubmit={submitLogin}>
      {errors.root?.server?.message && (
        <div
          className="rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm font-medium text-danger-text"
          id="administrative-login-error"
          role="alert"
        >
          {errors.root.server.message}
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-text" htmlFor="email">
          E-mail:
        </label>
        <div className="relative mt-2">
          <span aria-hidden="true" className="login-field-icon">
            <Icon name="mail" size={21} />
          </span>
          <TextField
            aria-describedby={emailDescriptionIds || undefined}
            aria-invalid={Boolean(errors.email)}
            autoCapitalize="none"
            autoComplete="username"
            className="login-field-input"
            data-filled={Boolean(emailValue)}
            id="email"
            inputMode="email"
            placeholder="nome@instituicao.edu.br"
            type="email"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p
            className="mt-2 text-sm font-semibold text-danger-text"
            id="email-error"
            role="alert"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-text" htmlFor="password">
          Senha:
        </label>
        <div className="relative mt-2">
          <span aria-hidden="true" className="login-field-icon">
            <Icon name="lock" size={21} />
          </span>
          <TextField
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="current-password"
            className="login-field-input login-password-field"
            data-filled={Boolean(passwordValue)}
            id="password"
            placeholder="Digite sua senha"
            type={isPasswordVisible ? "text" : "password"}
            {...register("password")}
          />
          <button
            aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={isPasswordVisible}
            className="login-password-toggle"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            type="button"
          >
            {isPasswordVisible ? (
              <svg
                aria-hidden="true"
                fill="none"
                focusable="false"
                viewBox="0 0 24 24"
              >
                <path
                  d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A11.3 11.3 0 0 1 12 4c5.2 0 8.5 4.6 9 6.3a1.8 1.8 0 0 1 0 1.4 10 10 0 0 1-2 3.3M6.2 6.2A11.6 11.6 0 0 0 3 10.3a1.8 1.8 0 0 0 0 1.4C3.5 13.4 6.8 18 12 18c1 0 2-.2 2.8-.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                fill="none"
                focusable="false"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 10.3C3.5 8.6 6.8 4 12 4s8.5 4.6 9 6.3a1.8 1.8 0 0 1 0 1.4C20.5 13.4 17.2 18 12 18s-8.5-4.6-9-6.3a1.8 1.8 0 0 1 0-1.4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="11"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p
            className="mt-2 text-sm font-semibold text-danger-text"
            id="password-error"
            role="alert"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        aria-busy={isSubmitting}
        className="w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting && (
          <span aria-hidden="true" className="login-submit-spinner" />
        )}
        {isSubmitting ? "Entrando..." : "Entrar"}
        {!isSubmitting && <Icon name="arrow-right" size={20} />}
      </Button>
    </form>
  );
}
