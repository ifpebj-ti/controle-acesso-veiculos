import { useId } from "react";
import { ActionFeedback } from "../../components/ui/ActionFeedback";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import type { FullscreenController } from "./useFullscreen";

export function FullscreenControl({
  fullscreen,
  className = "",
}: {
  fullscreen: FullscreenController;
  className?: string;
}) {
  const hintId = useId();
  if (!fullscreen.available) return null;
  return (
    <div className={className}>
      <Button
        aria-describedby={hintId}
        aria-pressed={fullscreen.active}
        aria-busy={fullscreen.pending}
        aria-disabled={fullscreen.pending}
        className={`w-full ${fullscreen.pending ? "opacity-60" : ""}`}
        onClick={() => void fullscreen.toggle()}
        variant="secondary"
      >
        <Icon name={fullscreen.active ? "minimize" : "maximize"} size={20} />
        {fullscreen.active ? "Sair da tela cheia" : "Entrar em tela cheia"}
      </Button>
      <p id={hintId} className="mt-2 text-xs text-text-muted">
        Opcional. Para sair, use também a saída do navegador ou Escape.
      </p>
      <ActionFeedback
        className="mt-2 text-sm"
        message={fullscreen.error}
        tone="error"
      />
    </div>
  );
}
