import { useId } from "react";
import { ActionFeedback } from "../../components/ui/ActionFeedback";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import type { FullscreenController } from "./useFullscreen";

export function FullscreenControl({
  fullscreen,
  className = "",
  compact = false,
  showError = true,
}: {
  fullscreen: FullscreenController;
  className?: string;
  compact?: boolean;
  showError?: boolean;
}) {
  const hintId = useId();
  if (!fullscreen.available) return null;
  return (
    <div className={className} data-fullscreen-control="">
      <Button
        aria-label={
          compact
            ? fullscreen.active
              ? "Desativar tela cheia"
              : "Ativar tela cheia"
            : undefined
        }
        title={
          compact
            ? fullscreen.active
              ? "Sair da tela cheia"
              : "Entrar em tela cheia"
            : undefined
        }
        aria-describedby={hintId}
        aria-pressed={fullscreen.active}
        aria-busy={fullscreen.pending}
        aria-disabled={fullscreen.pending}
        className={`${compact ? "shell-icon-button size-12 shrink-0 shadow-lg shadow-shadow" : "w-full"} ${fullscreen.pending ? "opacity-60" : ""}`}
        onClick={() => void fullscreen.toggle()}
        variant="secondary"
      >
        <Icon
          className="shrink-0"
          name={fullscreen.active ? "minimize" : "maximize"}
          size={compact ? 22 : 20}
        />
        {!compact &&
          (fullscreen.active ? "Sair da tela cheia" : "Entrar em tela cheia")}
      </Button>
      <p
        id={hintId}
        className={compact ? "sr-only" : "mt-2 text-xs text-text-muted"}
      >
        {fullscreen.active
          ? "Para voltar, use este botão ou Esc."
          : "Use toda a tela para trabalhar com mais espaço."}
      </p>
      {showError && (
        <div
          className={
            compact
              ? "absolute bottom-16 right-0 w-[min(24rem,calc(100vw-2rem))]"
              : ""
          }
        >
          <ActionFeedback
            className={compact ? "text-sm" : "mt-2 text-sm"}
            message={fullscreen.error}
            tone="error"
          />
        </div>
      )}
    </div>
  );
}
