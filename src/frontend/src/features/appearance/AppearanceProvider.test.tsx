import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../test/accessibility";
import { appearanceStorageKey } from "./appearance";
import { AppearanceProvider } from "./AppearanceProvider";
import { AppearanceSelector } from "./AppearanceSelector";

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    addEventListener: vi.fn(
      (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
    ),
    dispatchEvent: vi.fn(),
    get matches() {
      return matches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    removeEventListener: vi.fn(
      (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    ),
  } as unknown as MediaQueryList;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => mediaQuery),
  });

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function renderSelector() {
  return render(
    <AppearanceProvider>
      <AppearanceSelector />
      <label>
        Observação
        <input name="note" />
      </label>
    </AppearanceProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.removeProperty("color-scheme");
});

afterEach(() => vi.restoreAllMocks());

describe("appearance preference", () => {
  it("uses the operating-system preference without persisting the default", () => {
    installMatchMedia(true);
    renderSelector();

    expect(screen.getByRole("button", { name: "Sistema" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(window.localStorage).toHaveLength(0);
  });

  it("restores an explicit preference independently from the operating system", () => {
    window.localStorage.setItem(appearanceStorageKey, "dark");
    installMatchMedia(false);
    renderSelector();

    expect(screen.getByRole("button", { name: "Escuro" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("persists only the selected visual preference and keeps form state", async () => {
    installMatchMedia(false);
    const user = userEvent.setup();
    renderSelector();
    const note = screen.getByRole("textbox", { name: "Observação" });

    await user.type(note, "valor preservado");
    await user.click(screen.getByRole("button", { name: "Escuro" }));

    expect(note).toHaveValue("valor preservado");
    expect(window.localStorage).toHaveLength(1);
    expect(window.localStorage.getItem(appearanceStorageKey)).toBe("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Preferência Escuro. Tema aplicado: Escuro.",
    );
  });

  it("follows system changes only while Sistema is selected", async () => {
    const media = installMatchMedia(false);
    const user = userEvent.setup();
    renderSelector();

    act(() => media.setMatches(true));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    await user.click(screen.getByRole("button", { name: "Claro" }));
    act(() => media.setMatches(false));
    act(() => media.setMatches(true));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("recovers safely from a corrupted preference", () => {
    window.localStorage.setItem(appearanceStorageKey, "invalid-theme");
    installMatchMedia(false);
    renderSelector();

    expect(screen.getByRole("button", { name: "Sistema" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(window.localStorage.getItem(appearanceStorageKey)).toBeNull();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("keeps the in-memory selection when storage is unavailable", async () => {
    installMatchMedia(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage unavailable");
    });
    const user = userEvent.setup();
    renderSelector();

    await user.click(screen.getByRole("button", { name: "Escuro" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "Escuro" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("provides an accessible labeled controller", async () => {
    installMatchMedia(false);
    const user = userEvent.setup();
    const { container } = renderSelector();

    expect(screen.getByRole("group", { name: "Aparência" })).toBeVisible();
    await user.tab();
    expect(screen.getByRole("button", { name: "Claro" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Claro" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expectNoSeriousAccessibilityViolations(container);
  });
});

describe("appearance bootstrap", () => {
  it("runs a same-origin blocking script before the application module", () => {
    const html = readFileSync(resolve("index.html"), "utf8");
    const bootstrapPosition = html.indexOf(
      '<script src="/appearance-bootstrap.js"></script>',
    );
    const applicationPosition = html.indexOf(
      '<script type="module" src="/src/main.tsx"></script>',
    );

    expect(bootstrapPosition).toBeGreaterThan(-1);
    expect(applicationPosition).toBeGreaterThan(bootstrapPosition);
  });

  it("uses the same allowlisted storage key and applies color-scheme", () => {
    const bootstrap = readFileSync(
      resolve("public/appearance-bootstrap.js"),
      "utf8",
    );

    expect(bootstrap).toContain(appearanceStorageKey);
    expect(bootstrap).toContain("document.documentElement.dataset.theme");
    expect(bootstrap).toContain("document.documentElement.style.colorScheme");
    expect(bootstrap).not.toMatch(/token|password|credential|email|profile/i);
  });
});
