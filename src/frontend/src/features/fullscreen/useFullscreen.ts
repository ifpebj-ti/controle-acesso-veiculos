import { useCallback, useEffect, useRef, useState } from "react";

function supported() {
  return (
    document.fullscreenEnabled === true &&
    typeof document.documentElement.requestFullscreen === "function" &&
    typeof document.exitFullscreen === "function"
  );
}

/** One controller per authenticated layout; document root includes body portals. */
export function useFullscreen() {
  const [available, setAvailable] = useState(supported);
  const [active, setActive] = useState(() => !!document.fullscreenElement);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const ownsRequest = useRef(false);

  const exitOwnedFullscreen = useCallback(() => {
    if (
      !ownsRequest.current ||
      document.fullscreenElement !== document.documentElement
    )
      return;
    try {
      void document.exitFullscreen().catch(() => undefined);
    } catch {
      // Cleanup is best effort. Native browser exit remains available.
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    function update() {
      if (!document.fullscreenElement) ownsRequest.current = false;
      setActive(!!document.fullscreenElement);
      setAvailable(supported());
      setError(null);
    }
    document.addEventListener("fullscreenchange", update);
    return () => {
      mounted.current = false;
      document.removeEventListener("fullscreenchange", update);
      exitOwnedFullscreen();
    };
  }, [exitOwnedFullscreen]);

  async function toggle() {
    if (!mounted.current || inFlight.current || !supported()) return;
    const exiting = !!document.fullscreenElement;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      if (exiting) await document.exitFullscreen();
      else {
        ownsRequest.current = true;
        // Must be called directly from the user's action, without awaiting first.
        await document.documentElement.requestFullscreen();
      }
      if (!mounted.current) {
        exitOwnedFullscreen();
        return;
      }
      setActive(!!document.fullscreenElement);
    } catch {
      if (mounted.current) {
        if (!document.fullscreenElement) ownsRequest.current = false;
        setActive(!!document.fullscreenElement);
        setError(
          exiting
            ? "Não foi possível sair da tela cheia por este controle. Use a saída do navegador."
            : "Não foi possível abrir a tela cheia. Continue usando a visualização normal ou tente novamente.",
        );
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return { available, active, pending, error, toggle };
}

export type FullscreenController = ReturnType<typeof useFullscreen>;
