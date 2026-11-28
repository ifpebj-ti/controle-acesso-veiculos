import { vi } from "vitest";

/** jsdom lifecycle fixture only: does not exercise browser fullscreen. */
export function mockFullscreen() {
  let element: Element | null = null;
  let enabled = true;
  const originals = [
    [document, "fullscreenEnabled"],
    [document, "fullscreenElement"],
    [document, "exitFullscreen"],
    [document.documentElement, "requestFullscreen"],
  ] as const;
  const descriptors = originals.map(([target, key]) =>
    Object.getOwnPropertyDescriptor(target, key),
  );
  const change = (next: Element | null) => {
    element = next;
    document.dispatchEvent(new Event("fullscreenchange"));
  };
  const request = vi.fn(async () => change(document.documentElement));
  const exit = vi.fn(async () => change(null));
  Object.defineProperties(document, {
    fullscreenEnabled: { configurable: true, get: () => enabled },
    fullscreenElement: { configurable: true, get: () => element },
    exitFullscreen: { configurable: true, value: exit },
  });
  Object.defineProperty(document.documentElement, "requestFullscreen", {
    configurable: true,
    value: request,
  });
  return {
    request,
    exit,
    change,
    disable: () => {
      enabled = false;
    },
    restore: () =>
      originals.forEach(([target, key], index) => {
        const descriptor = descriptors[index];
        if (descriptor) Object.defineProperty(target, key, descriptor);
        else Reflect.deleteProperty(target, key);
      }),
  };
}
