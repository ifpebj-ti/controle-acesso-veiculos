export const fullscreenInvitationKey =
  "ifpe.vehicle-access.fullscreen-invitation.v1";

type Phase = "available" | "inviting" | "guidance" | "handled";

/** UI-only, per-tab flag. No identity or authentication data is persisted. */
export function createInvitationSession() {
  let phase: Phase;
  try {
    phase = sessionStorage.getItem(fullscreenInvitationKey)
      ? "handled"
      : "available";
  } catch {
    // A missing storage facility must not produce repeated unsolicited prompts.
    phase = "handled";
  }
  let account: number | null = null;
  const listeners = new Set<() => void>();

  function set(next: Phase) {
    if (phase === next) return;
    phase = next;
    listeners.forEach((listener) => listener());
  }

  function remember(next: Phase) {
    try {
      sessionStorage.setItem(fullscreenInvitationKey, "handled");
    } catch {
      // Do not show an unsolicited prompt that cannot survive a reload.
      if (next === "inviting") {
        set("handled");
        return;
      }
    }
    set(next);
  }

  function reset() {
    try {
      sessionStorage.removeItem(fullscreenInvitationKey);
    } catch {
      // The sidebar control remains usable regardless of storage support.
    }
    set("available");
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => phase,
    observe(status: string, userId: number | null) {
      if (status === "restoring") return;
      if (status !== "authenticated" || userId === null) {
        account = null;
        reset();
      } else {
        if (account !== null && account !== userId) reset();
        account = userId;
      }
    },
    show: () => {
      if (phase === "available") remember("inviting");
    },
    guide: () => remember("guidance"),
    finish: () => remember("handled"),
  };
}

export type InvitationSession = ReturnType<typeof createInvitationSession>;
