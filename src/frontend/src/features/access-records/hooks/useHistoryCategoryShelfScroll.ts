import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export function useHistoryCategoryShelfScroll(activeCategory: string) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });

  const updateEdges = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const previous = viewport.scrollLeft > 1;
    const next =
      viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1;
    setEdges((current) =>
      current.previous === previous && current.next === next
        ? current
        : { previous, next },
    );
  }, []);

  const revealCategory = useCallback((button: HTMLElement) => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.clientWidth === 0) return;
    const view = viewport.getBoundingClientRect();
    const item = button.getBoundingClientRect();
    const left =
      item.left < view.left + 8
        ? item.left - view.left - 8
        : item.right > view.right - 8
          ? item.right - view.right + 8
          : 0;
    // Horizontal movement only: do not scroll the page or animate essential navigation.
    if (left) viewport.scrollBy({ left, behavior: "auto" });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    function measure() {
      const selected = viewport?.querySelector<HTMLElement>(
        '[data-active="true"]',
      );
      if (selected) revealCategory(selected);
      updateEdges();
    }
    const frame = window.requestAnimationFrame(measure);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(viewport);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeCategory, revealCategory, updateEdges]);

  function moveViewport(direction: -1 | 1) {
    const viewport = viewportRef.current;
    viewport?.scrollBy({
      left: direction * viewport.clientWidth * 0.8,
      behavior: "auto",
    });
  }

  function navigateCategories(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const buttons = Array.from(
      viewportRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    const current = buttons.indexOf(event.target);
    const next =
      event.key === "ArrowRight"
        ? Math.min(current + 1, buttons.length - 1)
        : event.key === "ArrowLeft"
          ? Math.max(current - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : null;
    if (next === null || !buttons[next]) return;
    event.preventDefault();
    buttons[next].focus({ preventScroll: true });
    revealCategory(buttons[next]);
  }

  return {
    edges,
    moveViewport,
    navigateCategories,
    revealCategory,
    updateEdges,
    viewportRef,
  };
}
