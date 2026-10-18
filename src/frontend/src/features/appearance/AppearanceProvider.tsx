import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import {
  appearanceStorageKey,
  applyResolvedTheme,
  isAppearancePreference,
  persistAppearancePreference,
  readAppearancePreference,
  resolveTheme,
  systemDarkModeQuery,
} from "./appearance";
import { AppearanceContext } from "./AppearanceContext";
import type { AppearancePreference } from "./types";

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getSystemPreference() {
  try {
    return window.matchMedia?.(systemDarkModeQuery) ?? null;
  } catch {
    return null;
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const mediaQuery = useMemo(() => getSystemPreference(), []);
  const [preference, setPreferenceState] = useState<AppearancePreference>(() =>
    readAppearancePreference(getStorage()),
  );
  const [systemUsesDark, setSystemUsesDark] = useState(
    () => mediaQuery?.matches ?? false,
  );
  const resolvedTheme = resolveTheme(preference, systemUsesDark);

  useLayoutEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (!mediaQuery) return;

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setSystemUsesDark(event.matches);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [mediaQuery]);

  useEffect(() => {
    const handleStoredPreferenceChange = (event: StorageEvent) => {
      if (event.key !== appearanceStorageKey) return;

      setPreferenceState(
        isAppearancePreference(event.newValue) ? event.newValue : "system",
      );
    };

    window.addEventListener("storage", handleStoredPreferenceChange);
    return () =>
      window.removeEventListener("storage", handleStoredPreferenceChange);
  }, []);

  const setPreference = useCallback((nextPreference: AppearancePreference) => {
    setPreferenceState(nextPreference);
    persistAppearancePreference(nextPreference, getStorage());
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}
