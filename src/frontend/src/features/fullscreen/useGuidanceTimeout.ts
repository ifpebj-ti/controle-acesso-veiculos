import { useEffect } from "react";

/** Only the optional menu hint expires; invitations and errors do not. */
export function useGuidanceTimeout({
  enabled,
  paused,
  finish,
}: {
  enabled: boolean;
  paused: boolean;
  finish: () => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      clearTimeout(timer);
      if (!paused && document.visibilityState !== "hidden") {
        timer = setTimeout(finish, 12_000);
      }
    }
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [enabled, finish, paused]);
}
