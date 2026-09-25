import { StrictMode, createElement, useEffect } from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isRelevantHumanActivity,
  subscribeToHumanActivity,
} from "./humanActivity";

afterEach(() => vi.restoreAllMocks());

describe("human activity detection", () => {
  it.each(["keydown", "pointerdown", "touchstart"])(
    "accepts trusted %s interaction",
    (type) => {
      expect(isRelevantHumanActivity({ isTrusted: true, type })).toBe(true);
    },
  );

  it.each(["mousemove", "focus", "visibilitychange", "timer", "http"])(
    "does not accept %s as human activity",
    (type) => {
      expect(isRelevantHumanActivity({ isTrusted: true, type })).toBe(false);
    },
  );

  it("rejects synthetic keyboard and pointer events", () => {
    expect(isRelevantHumanActivity({ isTrusted: false, type: "keydown" })).toBe(
      false,
    );
    expect(
      isRelevantHumanActivity({ isTrusted: false, type: "pointerdown" }),
    ).toBe(false);
  });

  it("removes every listener when the subscription ends", () => {
    const documentAdd = vi.spyOn(document, "addEventListener");
    const documentRemove = vi.spyOn(document, "removeEventListener");
    const windowAdd = vi.spyOn(window, "addEventListener");
    const windowRemove = vi.spyOn(window, "removeEventListener");

    const unsubscribe = subscribeToHumanActivity({
      onActivity: vi.fn(),
      onResume: vi.fn(),
    });
    unsubscribe();

    expect(documentAdd).toHaveBeenCalledTimes(4);
    expect(documentRemove).toHaveBeenCalledTimes(4);
    expect(windowAdd).toHaveBeenCalledTimes(1);
    expect(windowRemove).toHaveBeenCalledTimes(1);
  });

  it("does not retain duplicate listeners through a StrictMode remount", () => {
    const activeDocumentListeners = new Map<
      string,
      Set<EventListenerOrEventListenerObject>
    >();
    const activeWindowListeners = new Map<
      string,
      Set<EventListenerOrEventListenerObject>
    >();
    const updateListeners = (
      collection: Map<string, Set<EventListenerOrEventListenerObject>>,
      type: string,
      listener: EventListenerOrEventListenerObject,
      add: boolean,
    ) => {
      const listeners = collection.get(type) ?? new Set();
      if (add) listeners.add(listener);
      else listeners.delete(listener);
      collection.set(type, listeners);
    };
    vi.spyOn(document, "addEventListener").mockImplementation(
      (type, listener) => {
        updateListeners(activeDocumentListeners, type, listener, true);
      },
    );
    vi.spyOn(document, "removeEventListener").mockImplementation(
      (type, listener) => {
        updateListeners(activeDocumentListeners, type, listener, false);
      },
    );
    vi.spyOn(window, "addEventListener").mockImplementation(
      (type, listener) => {
        updateListeners(activeWindowListeners, type, listener, true);
      },
    );
    vi.spyOn(window, "removeEventListener").mockImplementation(
      (type, listener) => {
        updateListeners(activeWindowListeners, type, listener, false);
      },
    );

    function Harness() {
      useEffect(
        () =>
          subscribeToHumanActivity({
            onActivity: vi.fn(),
            onResume: vi.fn(),
          }),
        [],
      );
      return null;
    }

    const view = render(
      createElement(StrictMode, null, createElement(Harness)),
    );

    for (const type of [
      "keydown",
      "pointerdown",
      "touchstart",
      "visibilitychange",
    ]) {
      expect(activeDocumentListeners.get(type)).toHaveLength(1);
    }
    expect(activeWindowListeners.get("pageshow")).toHaveLength(1);
    view.unmount();
    for (const type of [
      "keydown",
      "pointerdown",
      "touchstart",
      "visibilitychange",
    ]) {
      expect(activeDocumentListeners.get(type)).toHaveLength(0);
    }
    expect(activeWindowListeners.get("pageshow")).toHaveLength(0);
  });
});
