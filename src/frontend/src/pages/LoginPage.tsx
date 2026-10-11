import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";

import { Brand } from "../components/ui/Brand";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { TextField } from "../components/ui/TextField";
import { SessionLoadingState } from "../components/ui/SessionLoadingState";
import {
  AuthenticationContractError,
  type SessionEndReason,
  useSession,
} from "../features/authentication";
import {
  loginSchema,
  type LoginFormValues,
} from "../features/authentication/schemas/loginSchema";
import { describeApiError } from "../services/api-errors";

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
}

function loginErrorMessage(error: unknown) {
  if (error instanceof AuthenticationContractError) {
    return "A resposta de autenticação não pôde ser validada. Tente novamente mais tarde.";
  }

  const apiError = describeApiError(error);

  if (apiError.status === 401) {
    return "E-mail ou senha incorretos.";
  }

  return apiError.message;
}

function sessionEndMessage(reason: SessionEndReason) {
  switch (reason) {
    case "expired":
      return "Sua sessão expirou. Entre novamente para continuar.";
    case "inactive":
      return "Sua sessão terminou por inatividade. Entre novamente para continuar.";
    case "logout-unconfirmed":
      return "A sessão foi encerrada neste dispositivo, mas não foi possível confirmar a saída no servidor.";
    case "password-changed":
      return "Senha alterada com segurança. Entre novamente usando a nova senha.";
    case "restoration-unavailable":
      return "Não foi possível verificar uma sessão anterior. Você ainda pode entrar novamente.";
    case "unauthorized":
      return "Sua sessão não é mais válida. Entre novamente.";
    default:
      return null;
  }
}

export function LoginPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { login, sessionEndReason, status, user } = useSession();
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
  const locationState = location.state as LoginLocationState | null;
  const redirectTo = locationState?.from?.pathname ?? "/visao-geral";
  const emailValue = useWatch({ control, name: "email" });
  const passwordValue = useWatch({ control, name: "password" });

  if (status === "restoring") {
    return <SessionLoadingState title="Verificando sua sessão" />;
  }

  if (user && status === "authenticated") {
    return (
      <Navigate
        replace
        to={user.requiresPasswordChange ? "/conta/senha" : redirectTo}
      />
    );
  }

  const submitLogin = handleSubmit(async (values) => {
    try {
      const authenticatedUser = await login(values);
      navigate(
        authenticatedUser.requiresPasswordChange ? "/conta/senha" : redirectTo,
        { replace: true },
      );
    } catch (error) {
      setError("root.server", { message: loginErrorMessage(error) });
    }
  });
  const loginStatusMessage =
    errors.root?.server?.message ??
    (sessionEndReason ? sessionEndMessage(sessionEndReason) : null);
  const emailDescriptionIds = [
    errors.email ? "email-error" : null,
    loginStatusMessage ? "login-status-message" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="login-page relative min-h-svh overflow-x-hidden bg-background px-4 py-5 text-text sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-primary"
      />

      <div className="login-shell relative z-10 mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-7xl items-center justify-center sm:min-h-[calc(100svh-4rem)]">
        <section className="login-composition grid w-full overflow-hidden rounded-[1.75rem] border border-border-strong bg-surface-raised shadow-2xl lg:grid-cols-[minmax(0,1fr)_minmax(25rem,0.9fr)]">
          <div className="login-form-panel order-2 flex flex-col bg-surface-subtle px-6 py-8 sm:px-12 sm:py-10 lg:order-1 lg:px-16 lg:py-12 xl:px-20">
            <Brand className="login-brand hidden w-fit max-w-[19rem] lg:flex" />

            <div className="my-auto py-8 sm:py-9 lg:py-8">
              <header>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-primary">
                  Controle de acesso
                </p>
                <h1 className="font-display text-4xl font-bold leading-tight text-text sm:text-5xl">
                  Bem-vindo(a)!
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-text-muted">
                  Acesse sua conta para registrar e acompanhar a movimentação de
                  veículos no campus.
                </p>
              </header>

              {loginStatusMessage && (
                <div
                  className="mt-7 w-full max-w-xl rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm font-medium text-danger-text"
                  id="login-status-message"
                  role="alert"
                >
                  {loginStatusMessage}
                </div>
              )}

              <form
                className="mt-7 w-full max-w-xl space-y-5"
                noValidate
                onSubmit={submitLogin}
              >
                <div>
                  <label
                    className="text-sm font-semibold text-text"
                    htmlFor="email"
                  >
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
                      autoFocus
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
                  <label
                    className="text-sm font-semibold text-text"
                    htmlFor="password"
                  >
                    Senha:
                  </label>
                  <div className="relative mt-2">
                    <span aria-hidden="true" className="login-field-icon">
                      <Icon name="lock" size={21} />
                    </span>
                    <TextField
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
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
                      aria-label={
                        isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
                      }
                      aria-pressed={isPasswordVisible}
                      className="login-password-toggle"
                      onClick={() =>
                        setIsPasswordVisible((visible) => !visible)
                      }
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
            </div>

            <div className="login-support flex items-center gap-3 border-t border-border pt-5 text-xs leading-5 text-text-muted">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-success-surface text-success-text"
              >
                <Icon name="lock" size={18} />
              </span>
              <p>Utilize a conta individual cadastrada pelo administrador.</p>
            </div>
          </div>

          <div className="login-visual relative isolate order-1 flex min-h-[24rem] flex-col justify-between overflow-hidden border-b border-border px-7 py-7 text-primary-text sm:min-h-[30rem] sm:px-10 sm:py-10 lg:order-2 lg:min-h-[40rem] lg:border-b-0 lg:px-12 lg:py-12 lg:pl-40">
            <img
              alt=""
              className="login-visual-photo"
              src="/brand/campus-gatehouse.jpg"
            />
            <div aria-hidden="true" className="login-visual-photo-overlay" />
            <svg
              aria-hidden="true"
              className="login-visual-divider"
              focusable="false"
              preserveAspectRatio="none"
              viewBox="0 0 190 1000"
            >
              <path
                className="login-visual-divider-dark-band"
                d="M145 0C80 70 65 150 88 250C103 315 128 380 119 440C110 510 73 585 60 680C45 790 70 900 132 1000L0 1000L0 0Z"
              />
              <path
                className="login-visual-divider-light-band"
                d="M112 0C45 75 33 155 62 250C80 320 125 378 116 440C104 520 42 600 30 680C17 790 45 910 97 1000L0 1000L0 0Z"
              />
              <path
                className="login-visual-divider-surface"
                d="M82 0C15 80 10 160 42 250C65 330 120 380 110 440C98 520 24 605 16 680C7 790 30 910 70 1000L0 1000L0 0Z"
              />
              <path
                className="login-visual-road-line"
                d="M58 24C6 94 6 166 26 250C49 330 102 380 92 440C80 520 14 605 10 680C8 790 20 900 50 976"
              />
            </svg>

            <div className="login-mobile-brand relative z-10 w-fit max-w-[17rem] lg:hidden">
              <Brand decorative />
            </div>

            <div className="relative z-10 mt-auto pb-8 lg:mt-0 lg:pb-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-text/85">
                Controle de Acesso de Veículos
              </p>
              <p className="mt-3 max-w-md text-2xl font-bold leading-8 lg:text-3xl lg:leading-10">
                Uma rotina mais clara para quem cuida da portaria.
              </p>
            </div>

            <div className="relative z-10 hidden border-t border-primary-text/30 pt-5 sm:block">
              <p className="max-w-md text-sm font-medium leading-6 text-primary-text/90">
                Registre e acompanhe as movimentações de veículos do campus em
                um único lugar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
