import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { Brand } from "../components/ui/Brand";
import {
  AuthenticationContractError,
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

  if (user && status === "authenticated") {
    return <Navigate replace to={redirectTo} />;
  }

  const submitLogin = handleSubmit(async (values) => {
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError("root.server", { message: loginErrorMessage(error) });
    }
  });

  return (
    <main className="relative min-h-svh overflow-hidden bg-cream px-4 py-6 text-ink sm:px-8 sm:py-8">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-ink" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl flex-col items-center justify-center">
        <Brand className="mx-auto mb-7 w-fit max-w-[17rem] sm:mb-10 sm:max-w-sm" />

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

          <section className="relative z-10 mx-auto flex min-h-[34rem] flex-col rounded-[2rem] border border-ink/75 bg-brand-soft px-6 py-10 shadow-[0_22px_65px_rgba(1,36,40,0.11)] sm:min-h-[40rem] sm:rounded-[2.5rem] sm:px-14 sm:py-14 lg:min-h-[42rem] lg:px-20 lg:pb-16 lg:pt-20">
            <header className="text-center">
              <h1 className="font-display text-4xl font-bold uppercase leading-none text-brand sm:text-6xl lg:text-[4.4rem]">
                Bem-vindo,
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-xs font-medium uppercase leading-5 tracking-[0.08em] text-ink/80 sm:text-sm">
                Ao sistema de acesso e cadastro de veículos no campus!
              </p>
            </header>

            {(sessionEndReason || errors.root?.server) && (
              <div
                className="mx-auto mt-7 w-full max-w-2xl rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-950"
                role="alert"
              >
                {errors.root?.server?.message ??
                  (sessionEndReason === "expired"
                    ? "Sua sessão expirou. Entre novamente para continuar."
                    : "Sua sessão não é mais válida. Entre novamente.")}
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
                <input
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={Boolean(errors.email)}
                  autoCapitalize="none"
                  autoComplete="username"
                  autoFocus
                  className="mt-2 min-h-13 w-full rounded-full border border-transparent bg-[#d8e6c6] px-6 text-ink outline-none transition placeholder:text-ink/40 focus:border-brand-dark focus:bg-cream focus:ring-3 focus:ring-brand/25 aria-invalid:border-red-700 aria-invalid:bg-red-50 sm:min-h-14"
                  id="email"
                  inputMode="email"
                  placeholder="nome@instituicao.edu.br"
                  type="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p
                    className="ml-2 mt-2 text-sm font-semibold text-red-800"
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
                <input
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="current-password"
                  className="mt-2 min-h-13 w-full rounded-full border border-transparent bg-[#d8e6c6] px-6 text-ink outline-none transition focus:border-brand-dark focus:bg-cream focus:ring-3 focus:ring-brand/25 aria-invalid:border-red-700 aria-invalid:bg-red-50 sm:min-h-14"
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p
                    className="ml-2 mt-2 text-sm font-semibold text-red-800"
                    id="password-error"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="pt-2 text-center sm:pt-4">
                <button
                  className="min-h-13 w-full rounded-2xl bg-brand px-8 font-display text-xl font-bold uppercase text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/35 disabled:cursor-wait disabled:opacity-65 sm:min-h-16 sm:w-auto sm:min-w-[17rem] sm:text-[1.75rem]"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Entrando…" : "Entrar"}
                </button>
              </div>
            </form>
          </section>

          <div aria-hidden="true" className="login-bus-static">
            <img
              alt=""
              className="block h-auto w-full drop-shadow-[0_12px_10px_rgba(1,36,40,0.16)]"
              src="/brand/bus-illustration.png"
            />
          </div>
        </div>

        <div className="mx-auto mt-3 max-w-3xl text-center text-xs leading-5 text-ink/65">
          <p>Use sua conta individual cadastrada pelo Administrador.</p>
          <p className="mt-1">
            Por segurança, a sessão não é salva no navegador e será encerrada ao
            atualizar ou fechar esta página.
          </p>
        </div>
      </div>
    </main>
  );
}
