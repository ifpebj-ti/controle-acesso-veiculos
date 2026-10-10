import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { Brand } from "../components/ui/Brand";
import { Button } from "../components/ui/Button";
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
    return "E-mail ou senha inválidos, ou a conta está temporariamente indisponível.";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { login, sessionEndReason, status, user } = useSession();
  const {
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
    <main className="login-page relative min-h-svh overflow-x-hidden bg-background px-4 py-6 text-text sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-primary"
      />

      <div className="login-shell relative z-10 mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl flex-col items-center justify-center sm:min-h-[calc(100svh-4rem)]">
        <Brand className="login-brand mx-auto mb-7 w-fit max-w-[17rem] sm:mb-10 sm:max-w-sm" />

        <div className="login-scene relative mx-auto w-full max-w-[54rem] pb-20 sm:pb-28">
          <div aria-hidden="true" className="login-route-marks">
            <svg
              className="login-route-loop"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <rect
                className="login-route-loop__stroke"
                fill="none"
                height="98"
                pathLength="100"
                rx="7"
                ry="8"
                vectorEffect="non-scaling-stroke"
                width="98"
                x="1"
                y="1"
              />
            </svg>
          </div>

          <section className="login-card relative z-10 mx-auto flex min-h-[34rem] flex-col rounded-2xl border border-border bg-surface px-6 py-10 sm:min-h-[40rem] sm:px-14 sm:py-14 lg:min-h-[42rem] lg:px-20 lg:pb-16 lg:pt-20">
            <header className="text-center">
              <h1 className="text-4xl font-bold leading-tight text-text sm:text-5xl">
                Bem-vindo,
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-xs font-medium uppercase leading-5 tracking-[0.08em] text-ink sm:text-sm">
                Ao sistema de acesso e cadastro de veículos no campus!
              </p>
            </header>

            {loginStatusMessage && (
              <div
                className="mx-auto mt-7 w-full max-w-2xl rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm font-medium text-danger-text"
                id="login-status-message"
                role="alert"
              >
                {loginStatusMessage}
              </div>
            )}

            <form
              className="mx-auto mt-8 w-full max-w-2xl space-y-6 sm:mt-10 sm:space-y-8"
              noValidate
              onSubmit={submitLogin}
            >
              <div>
                <label
                  className="ml-2 text-sm font-semibold uppercase text-ink"
                  htmlFor="email"
                >
                  E-mail:
                </label>
                <TextField
                  aria-describedby={emailDescriptionIds || undefined}
                  aria-invalid={Boolean(errors.email)}
                  autoCapitalize="none"
                  autoComplete="username"
                  autoFocus
                  className="mt-2"
                  id="email"
                  inputMode="email"
                  placeholder="nome@instituicao.edu.br"
                  type="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p
                    className="ml-2 mt-2 text-sm font-semibold text-danger-text"
                    id="email-error"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="ml-2 text-sm font-semibold uppercase text-ink"
                  htmlFor="password"
                >
                  Senha:
                </label>
                <TextField
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="current-password"
                  className="mt-2"
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p
                    className="ml-2 mt-2 text-sm font-semibold text-danger-text"
                    id="password-error"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="pt-2 text-center sm:pt-4">
                <Button
                  className="w-full sm:w-auto sm:min-w-[17rem]"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Entrando…" : "Entrar"}
                </Button>
              </div>
            </form>
          </section>

          <div aria-hidden="true" className="login-bus-static">
            <img
              alt=""
              className="block h-auto w-full"
              src="/brand/bus-illustration.png"
            />
          </div>
        </div>

        <div className="login-support mx-auto mt-3 max-w-3xl text-center text-xs leading-5 text-ink-soft">
          <p>Use sua conta individual cadastrada pelo Administrador.</p>
          <p className="mt-1">
            Sua sessão é protegida e pode ser restaurada com segurança enquanto
            estiver válida.
          </p>
        </div>
      </div>
    </main>
  );
}
