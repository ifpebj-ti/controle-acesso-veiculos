import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SessionCoordinationUnavailableError,
  broadcastSessionEnded,
  runWithSessionRefreshLock,
  subscribeToSessionEvents,
} from "./sessionCoordination";

afterEach(() => vi.unstubAllGlobals());

describe("cross-tab session coordination", () => {
  it("uses an exclusive browser lock for refresh", async () => {
    const request = vi.fn(
      async (_name: string, _options: object, operation: () => unknown) =>
        operation(),
    );
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: { request },
    });
    const operation = vi.fn().mockResolvedValue("renewed-token");

    await expect(runWithSessionRefreshLock(operation)).resolves.toBe(
      "renewed-token",
    );
    expect(request).toHaveBeenCalledWith(
      "controle-acesso-veiculos:session-refresh",
      { mode: "exclusive" },
      operation,
    );
  });

  it("fails closed when the browser cannot coordinate refreshes", async () => {
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: undefined,
    });

    await expect(
      runWithSessionRefreshLock(async () => "token"),
    ).rejects.toBeInstanceOf(SessionCoordinationUnavailableError);
  });

  it("broadcasts only a session-ended event and never a token", () => {
    const postedMessages: unknown[] = [];
    let receiveMessage: ((message: { data: unknown }) => void) | undefined;
    class TestBroadcastChannel {
      addEventListener(
        _type: string,
        listener: (message: { data: unknown }) => void,
      ) {
        receiveMessage = listener;
      }
      postMessage(message: unknown) {
        postedMessages.push(message);
      }
    }
    vi.stubGlobal("BroadcastChannel", TestBroadcastChannel);
    const listener = vi.fn();
    const unsubscribe = subscribeToSessionEvents(listener);

    broadcastSessionEnded();
    receiveMessage?.({ data: { type: "session-ended" } });

    expect(postedMessages).toEqual([{ type: "session-ended" }]);
    expect(JSON.stringify(postedMessages)).not.toContain("token");
    expect(listener).toHaveBeenCalledWith({ type: "session-ended" });
    unsubscribe();
  });
});
