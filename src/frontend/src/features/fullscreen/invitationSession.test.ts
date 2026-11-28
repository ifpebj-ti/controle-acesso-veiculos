import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInvitationSession,
  fullscreenInvitationKey,
} from "./invitationSession";

describe("fullscreen invitation UI lifecycle", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("remembers presentation across document reload, without storing an identity", () => {
    const session = createInvitationSession();
    session.observe("authenticated", 42);
    session.show();
    expect(session.getSnapshot()).toBe("inviting");
    expect(sessionStorage.getItem(fullscreenInvitationKey)).toBe("handled");
    expect(sessionStorage.length).toBe(1);
    const reloaded = createInvitationSession();
    reloaded.observe("restoring", null);
    reloaded.observe("authenticated", 42);
    expect(reloaded.getSnapshot()).toBe("handled");
  });

  it("does not reopen after dismissal, navigation or a native exit", () => {
    const session = createInvitationSession();
    session.show();
    session.guide();
    session.show();
    session.observe("authenticated", 42);
    session.observe("authenticated", 42);
    expect(session.getSnapshot()).toBe("guidance");
  });

  it("starts a new invitation after logout, including the same account", () => {
    const session = createInvitationSession();
    session.observe("authenticated", 42);
    session.show();
    session.guide();
    session.observe("unauthenticated", null);
    expect(sessionStorage.getItem(fullscreenInvitationKey)).toBeNull();
    session.observe("authenticated", 42);
    expect(session.getSnapshot()).toBe("available");
  });

  it("resets a direct account switch but not ordinary renewal", () => {
    const session = createInvitationSession();
    session.observe("authenticated", 42);
    session.finish();
    session.observe("authenticated", 42);
    expect(session.getSnapshot()).toBe("handled");
    session.observe("authenticated", 43);
    expect(session.getSnapshot()).toBe("available");
  });

  it("resets on an explicit login attempt, without changing authentication", () => {
    const session = createInvitationSession();
    session.finish();
    session.observe("authenticating", null);
    expect(session.getSnapshot()).toBe("available");
    expect(sessionStorage.getItem(fullscreenInvitationKey)).toBeNull();
  });

  it("does not offer repeatedly when storage cannot be read", () => {
    const get = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("unavailable");
      });
    try {
      expect(createInvitationSession().getSnapshot()).toBe("handled");
    } finally {
      get.mockRestore();
    }
  });

  it("suppresses an unsolicited prompt when its flag cannot be persisted", () => {
    const session = createInvitationSession();
    const set = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("unavailable");
      });
    try {
      session.show();
      expect(session.getSnapshot()).toBe("handled");
      session.show();
      expect(session.getSnapshot()).toBe("handled");
    } finally {
      set.mockRestore();
    }
  });
});
