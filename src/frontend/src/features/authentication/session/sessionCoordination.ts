const refreshLockName = "controle-acesso-veiculos:session-refresh";
const channelName = "controle-acesso-veiculos:session-events";

type SessionEvent = { type: "session-ended" };
type SessionEventListener = (event: SessionEvent) => void;

let channel: BroadcastChannel | null = null;
const listeners = new Set<SessionEventListener>();

export class SessionCoordinationUnavailableError extends Error {
  constructor() {
    super("Cross-tab session coordination is unavailable.");
    this.name = "SessionCoordinationUnavailableError";
  }
}

export async function runWithSessionRefreshLock<T>(
  operation: () => Promise<T>,
): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    throw new SessionCoordinationUnavailableError();
  }

  return navigator.locks.request(
    refreshLockName,
    { mode: "exclusive" },
    operation,
  );
}

export function broadcastSessionEnded() {
  getSessionChannel()?.postMessage({
    type: "session-ended",
  } satisfies SessionEvent);
}

export function subscribeToSessionEvents(listener: SessionEventListener) {
  listeners.add(listener);
  getSessionChannel();

  return () => {
    listeners.delete(listener);
  };
}

function getSessionChannel() {
  if (channel || typeof BroadcastChannel === "undefined") return channel;

  channel = new BroadcastChannel(channelName);
  channel.addEventListener("message", (message: MessageEvent<unknown>) => {
    if (!isSessionEvent(message.data)) return;
    const event = message.data;
    listeners.forEach((listener) => listener(event));
  });
  return channel;
}

function isSessionEvent(value: unknown): value is SessionEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "session-ended"
  );
}
