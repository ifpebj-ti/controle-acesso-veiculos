import { useSyncExternalStore } from "react";
import { FullscreenControl } from "./FullscreenControl";
import type { FullscreenController } from "./useFullscreen";

function hasBlockingLayer() {
  return Array.from(
    document.querySelectorAll(
      '[role="dialog"], [role="alertdialog"], dialog[open], [role="status"].fixed, [role="alert"].fixed',
    ),
  ).some((element) => {
    if (element.closest('[hidden], [aria-hidden="true"]')) return false;
    for (
      let current: Element | null = element;
      current;
      current = current.parentElement
    ) {
      const style = getComputedStyle(current);
      if (style.display === "none" || style.visibility === "hidden")
        return false;
    }
    return true;
  });
}

function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["role", "class", "open"],
  });
  window.addEventListener("resize", listener);
  return () => {
    observer.disconnect();
    window.removeEventListener("resize", listener);
  };
}

/** Shared native controller; kept below dialogs and out of floating feedback. */
export function FullscreenShortcut({
  fullscreen,
}: {
  fullscreen: FullscreenController;
}) {
  const blocked = useSyncExternalStore(subscribe, hasBlockingLayer);
  if (blocked || !fullscreen.available) return null;
  return (
    <FullscreenControl
      compact
      fullscreen={fullscreen}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-20"
    />
  );
}
