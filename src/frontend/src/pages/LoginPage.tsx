import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { Brand } from "../components/ui/Brand";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { SessionLoadingState } from "../components/ui/SessionLoadingState";
import {
  startGoogleAuthentication,
  type SessionEndReason,
  useSession,
} from "../features/authentication";
import { AdministrativeLoginForm } from "../features/authentication/components/AdministrativeLoginForm";
import { GoogleBrandIcon } from "../features/authentication/components/GoogleBrandIcon";
import { useAuthenticationProviders } from "../features/authentication/hooks/useAuthenticationProviders";
import { getLoginDestination } from "../routes/loginDestination";

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
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
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [isAdministrativeAccessOpen, setIsAdministrativeAccessOpen] =
    useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const callbackHandled = useRef(false);
  const administrativeAccessRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreAdministrativeFocus = useRef(false);
  const statusMessageRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { retry, state: providersState } = useAuthenticationProviders();
  const { restoreExternalSession, sessionEndReason, status, user } =
    useSession();
  const locationState = location.state as LoginLocationState | null;
  const requestedPath = locationState?.from?.pathname;
  const authenticationReturnStatus = searchParams.get("status");

  useEffect(() => {
    if (
      callbackHandled.current ||
      status === "restoring" ||
      (authenticationReturnStatus !== "success" &&
        authenticationReturnStatus !== "denied")
    ) {
      return;
    }

    callbackHandled.current = true;
    const remainingSearchParams = new URLSearchParams(searchParams);
    remainingSearchParams.delete("status");
    setSearchParams(remainingSearchParams, {
      replace: true,
      state: location.state,
    });

    if (authenticationReturnStatus === "denied") {
      queueMicrotask(() => {
        setCallbackError(
          "Não foi possível concluir o acesso. Verifique sua conta autorizada e tente novamente.",
        );
        window.setTimeout(() => statusMessageRef.current?.focus());
      });
      return;
    }

    if (status === "authenticated") return;

    void restoreExternalSession()
      .then((authenticatedUser) => {
        navigate(getLoginDestination(authenticatedUser, requestedPath), {
          replace: true,
        });
      })
      .catch(() => {
        setCallbackError(
          "Não foi possível confirmar uma sessão válida. Inicie o acesso novamente.",
        );
        window.setTimeout(() => statusMessageRef.current?.focus());
      });
  }, [
    authenticationReturnStatus,
    location.state,
    navigate,
    requestedPath,
    restoreExternalSession,
    searchParams,
    setSearchParams,
    status,
  ]);

  useEffect(() => {
    if (
      status !== "unauthenticated" ||
      authenticationReturnStatus ||
      providersState.status === "loading"
    ) {
      return;
    }

    const focusTimeout = window.setTimeout(() => {
      if (document.activeElement !== document.body) return;

      const targetId =
        providersState.status === "ready" && providersState.googleEnabled
          ? "google-login"
          : providersState.status === "unavailable"
            ? "provider-discovery-retry"
            : "administrative-access-toggle";
      document.querySelector<HTMLElement>(`#${targetId}`)?.focus();
    });

    return () => window.clearTimeout(focusTimeout);
  }, [authenticationReturnStatus, providersState, status]);

  useEffect(() => {
    if (isAdministrativeAccessOpen) {
      document.querySelector<HTMLElement>("#email")?.focus();
    } else if (shouldRestoreAdministrativeFocus.current) {
      shouldRestoreAdministrativeFocus.current = false;
      administrativeAccessRef.current?.focus();
    }
  }, [isAdministrativeAccessOpen]);

  if (status === "restoring") {
    return (
      <SessionLoadingState
        title={
          authenticationReturnStatus === "success"
            ? "Concluindo seu acesso"
            : "Verificando sua sessão"
        }
      />
    );
  }

  if (user && status === "authenticated") {
    return <Navigate replace to={getLoginDestination(user, requestedPath)} />;
  }

  const loginStatusMessage =
    callbackError ??
    (sessionEndReason ? sessionEndMessage(sessionEndReason) : null);
  const openAdministrativeAccess = () => {
    shouldRestoreAdministrativeFocus.current = true;
    setIsAdministrativeAccessOpen(true);
  };
  const closeAdministrativeAccess = () => {
    setIsAdministrativeAccessOpen(false);
  };
  const beginGoogleAccess = () => {
    setCallbackError(null);
    setIsGoogleRedirecting(true);
    try {
      startGoogleAuthentication();
    } catch {
      setIsGoogleRedirecting(false);
      setCallbackError(
        "Não foi possível iniciar o acesso agora. Tente novamente mais tarde.",
      );
      window.setTimeout(() => statusMessageRef.current?.focus());
    }
  };

  return (
    <main className="login-page relative min-h-svh overflow-x-hidden bg-background text-text">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-primary"
      />

      <div className="login-shell relative z-10 flex min-h-svh w-full items-stretch">
        <section className="login-composition grid min-h-svh w-full overflow-hidden bg-surface-raised lg:grid-cols-[minmax(34rem,54%)_minmax(28rem,46%)]">
          <div className="login-form-panel order-2 flex min-h-full flex-col bg-surface-subtle px-6 py-8 sm:px-12 sm:py-10 lg:order-1 lg:px-[clamp(4rem,7vw,9rem)] lg:py-12">
            <Brand className="login-brand hidden w-fit max-w-[19rem] lg:flex" />

            <div className="my-auto py-8 sm:py-9 lg:py-8">
              <header>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-primary">
                  Controle de acesso
                </p>
                <h1
                  className="font-display text-4xl font-bold leading-tight text-text sm:text-5xl"
                  id="login-view-title"
                >
                  {isAdministrativeAccessOpen
                    ? "Acesso administrativo"
                    : "Bem-vindo(a)!"}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-text-muted">
                  {isAdministrativeAccessOpen
                    ? "Entre com e-mail e senha. Exclusivo para contas do perfil Administrador."
                    : "Acesse sua conta para registrar e acompanhar a movimentação de veículos no campus."}
                </p>
              </header>

              {loginStatusMessage && (
                <div
                  className="mt-7 w-full max-w-xl rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm font-medium text-danger-text"
                  id="login-status-message"
                  ref={statusMessageRef}
                  role="alert"
                  tabIndex={-1}
                >
                  {loginStatusMessage}
                </div>
              )}

              {!isAdministrativeAccessOpen ? (
                <>
                  <div className="mt-7 w-full max-w-xl">
                    {providersState.status === "loading" && (
                      <div
                        aria-live="polite"
                        className="rounded-xl border border-border bg-surface px-4 py-4 text-sm text-text-muted"
                        role="status"
                      >
                        Verificando as opções de acesso…
                      </div>
                    )}

                    {providersState.status === "ready" &&
                      providersState.googleEnabled && (
                        <div>
                          <p className="mb-3 text-sm leading-6 text-text-muted">
                            Para Porteiro, Vigilante e Setor de Transporte.
                          </p>
                          <Button
                            aria-busy={isGoogleRedirecting}
                            className="w-full"
                            disabled={isGoogleRedirecting}
                            id="google-login"
                            onClick={beginGoogleAccess}
                          >
                            <GoogleBrandIcon />
                            {isGoogleRedirecting
                              ? "Redirecionando…"
                              : "Continuar com Google"}
                          </Button>
                          <p className="mt-3 text-sm leading-6 text-text-muted">
                            Use sua conta Google pessoal ou institucional, ativa
                            e previamente autorizada pelo Administrador.
                          </p>
                        </div>
                      )}

                    {providersState.status === "ready" &&
                      !providersState.googleEnabled && (
                        <div>
                          <Button
                            aria-describedby="google-unavailable-message"
                            className="w-full"
                            disabled
                            id="google-login"
                          >
                            <GoogleBrandIcon />
                            Continuar com Google
                          </Button>
                          <p
                            className="mt-3 text-sm leading-6 text-text-muted"
                            id="google-unavailable-message"
                            role="status"
                          >
                            O acesso com Google não está disponível neste
                            ambiente.
                          </p>
                        </div>
                      )}

                    {providersState.status === "unavailable" && (
                      <div
                        className="rounded-xl border border-danger-border bg-danger-surface px-4 py-4 text-sm text-danger-text"
                        role="alert"
                      >
                        <p>
                          Não foi possível verificar as opções de acesso. Tente
                          novamente.
                        </p>
                        <Button
                          className="mt-3"
                          id="provider-discovery-retry"
                          onClick={retry}
                          variant="secondary"
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 w-full max-w-xl border-t border-border pt-5">
                    <p className="text-xs text-text-muted">
                      Acesso administrativo
                    </p>
                    <button
                      className="mt-1 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-primary underline underline-offset-4 focus:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                      id="administrative-access-toggle"
                      onClick={openAdministrativeAccess}
                      ref={administrativeAccessRef}
                      type="button"
                    >
                      Entrar com usuário e senha
                    </button>
                  </div>
                </>
              ) : (
                <section
                  aria-labelledby="login-view-title"
                  className="mt-7 w-full max-w-xl"
                >
                  <AdministrativeLoginForm
                    externalDescriptionId={
                      loginStatusMessage ? "login-status-message" : undefined
                    }
                    onBack={closeAdministrativeAccess}
                    onAuthenticated={(authenticatedUser) =>
                      navigate(
                        getLoginDestination(authenticatedUser, requestedPath),
                        { replace: true },
                      )
                    }
                  />
                </section>
              )}
            </div>

            <div className="login-support flex items-center gap-3 border-t border-border pt-5 text-xs leading-5 text-text-muted">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-success-surface text-success-text"
              >
                <Icon name="lock" size={18} />
              </span>
              <p>
                O acesso é permitido somente a contas previamente autorizadas
                pelo Administrador.
              </p>
            </div>
          </div>

          <div className="login-visual relative isolate order-1 flex min-h-[24rem] flex-col justify-between overflow-hidden border-b border-border px-7 py-7 text-visual-text sm:min-h-[30rem] sm:px-10 sm:py-10 lg:order-2 lg:min-h-svh lg:border-b-0 lg:px-12 lg:py-12 lg:pl-40">
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
              <p className="login-visual-eyebrow text-xs font-bold uppercase tracking-[0.18em]">
                Controle de Acesso de Veículos
              </p>
              <p className="mt-3 max-w-md text-2xl font-bold leading-8 lg:text-3xl lg:leading-10">
                Uma rotina{" "}
                <span className="login-visual-highlight">mais clara</span> para
                quem cuida da portaria.
              </p>
            </div>

            <div className="relative z-10 hidden border-t border-visual-text/30 pt-5 sm:block">
              <p className="max-w-md text-sm font-medium leading-6 text-visual-text/90">
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
