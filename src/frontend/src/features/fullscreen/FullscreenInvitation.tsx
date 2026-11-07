import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { InvitationContext } from "./invitationContext";
import type { InvitationSession } from "./invitationSession";
import type { FullscreenController } from "./useFullscreen";
import { useGuidanceTimeout } from "./useGuidanceTimeout";

const menuGuidance =
  "Você pode ativar a tela cheia a qualquer momento pelo menu lateral, abaixo de Aparência.";

function Invitation({
  session,
  fullscreen,
  blocked,
}: {
  session: InvitationSession;
  fullscreen: FullscreenController;
  blocked: boolean;
}) {
  const phase = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const { pathname } = useLocation();
  const headingId = useId();
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const attempting = useRef(false);
  const focusFeedback = useRef(false);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const onOverview = pathname.replace(/\/+$/, "") === "/visao-geral";

  useGuidanceTimeout({
    enabled: phase === "guidance" && onOverview && !blocked,
    paused: pointerInside || focusInside,
    finish: session.finish,
  });

  useEffect(() => {
    if (phase !== "available" && phase !== "inviting") return;
    function update() {
      if (blocked || !onOverview || !fullscreen.available) {
        if (phase === "inviting") session.finish();
        return;
      }
      if (fullscreen.active) {
        if (!attempting.current) session.finish();
        return;
      }
      if (document.visibilityState === "hidden") return;
      if (
        Array.from(
          document.querySelectorAll(
            '[role="dialog"], [role="alertdialog"], dialog[open], [role="alert"]',
          ),
        ).some((element) => !element.closest("[data-fullscreen-control]"))
      ) {
        if (phase === "inviting") session.finish();
        return;
      }
      if (
        document.activeElement?.matches(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]',
        )
      ) {
        session.finish();
        return;
      }
      session.show();
    }
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["role", "open", "aria-modal"],
    });
    document.addEventListener("focusin", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [
    blocked,
    fullscreen.active,
    fullscreen.available,
    onOverview,
    phase,
    session,
  ]);

  useEffect(() => {
    if (
      focusFeedback.current &&
      !fullscreen.pending &&
      (phase === "guidance" || fullscreen.error)
    ) {
      focusFeedback.current = false;
      const pageHeading = document.querySelector<HTMLElement>(
        "#conteudo-principal h1, h1",
      );
      if (phase === "guidance" && pageHeading) {
        // Keep keyboard focus on a stable target when this optional hint expires.
        pageHeading.tabIndex = -1;
        pageHeading.focus({ preventScroll: true });
      } else {
        feedbackRef.current?.focus();
      }
    }
  }, [phase, fullscreen.pending, fullscreen.error]);

  function dismiss() {
    if (attempting.current) return;
    focusFeedback.current = true;
    session.guide();
  }

  async function accept(trigger: HTMLButtonElement) {
    if (attempting.current || fullscreen.pending) return;
    attempting.current = true;
    await fullscreen.toggle();
    attempting.current = false;
    if (!trigger.isConnected || !onOverview) return;
    focusFeedback.current =
      document.activeElement === trigger ||
      document.activeElement === document.body;
    if (document.fullscreenElement) session.guide();
  }

  if (
    !onOverview ||
    blocked ||
    !fullscreen.available ||
    (phase !== "inviting" && phase !== "guidance")
  )
    return null;

  return (
    <section
      aria-labelledby={headingId}
      className="mb-5 rounded-2xl border border-border bg-surface p-4 text-text sm:p-5"
      onMouseEnter={() => {
        if (phase === "guidance") setPointerInside(true);
      }}
      onMouseLeave={() => setPointerInside(false)}
      onFocusCapture={() => {
        if (phase === "guidance") setFocusInside(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocusInside(false);
      }}
    >
      <h2
        className="flex items-center gap-2 text-base font-semibold"
        id={headingId}
      >
        <Icon name="maximize" size={20} />
        {phase === "inviting"
          ? "Quer usar o sistema em tela cheia?"
          : "Tela cheia pelo menu lateral"}
      </h2>
      {phase === "inviting" && (
        <>
          <p className="mt-2 text-sm text-text-muted">
            É opcional. Você pode continuar usando a visualização normal.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              aria-busy={fullscreen.pending}
              aria-disabled={fullscreen.pending}
              onClick={(event) => void accept(event.currentTarget)}
            >
              Entrar em tela cheia
            </Button>
            <Button
              aria-disabled={fullscreen.pending}
              variant="secondary"
              onClick={dismiss}
            >
              Agora não
            </Button>
          </div>
        </>
      )}
      <p
        aria-live="polite"
        aria-atomic="true"
        role="status"
        tabIndex={-1}
        ref={feedbackRef}
        className={
          phase === "guidance" || fullscreen.error
            ? "mt-3 rounded-lg text-sm leading-6 focus-visible:outline-3 focus-visible:outline-focus"
            : "sr-only"
        }
      >
        {phase === "guidance" ? menuGuidance : fullscreen.error}
      </p>
    </section>
  );
}

export function FullscreenInvitation({
  fullscreen,
  blocked = false,
}: {
  fullscreen: FullscreenController;
  blocked?: boolean;
}) {
  const session = useContext(InvitationContext);
  return session ? (
    <Invitation session={session} fullscreen={fullscreen} blocked={blocked} />
  ) : null;
}
